import { IQueryReturn, createConnection } from 'mysql2/promise'
import * as sqlformatter from 'sql-formatter'

import { ConnectionOptions, DataDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'
import typeCast from './typeCast'

interface QueryRes {
    [k : string] : any
}

function buildInsert(result : IQueryReturn<QueryRes>, table : Table) {
    const cols = result[1].map(f => f.name)

    const sqlLines = result[0].map(row => sqlformatter.format([
        `INSERT INTO \`${table.name}\` (\`${cols.join('`,`')}\`)`,
        `VALUES (${cols.map(c => row[c]).join(',')});`,
    ].join(' ')))

    return sqlLines
}

export default async function (connectionOptions : ConnectionOptions, options : DataDumpOptions, tables : Table[]) {
    // we open a new connection with a special typecast function for dumping data
    const connection = await createConnection({
        ...connectionOptions,
        multipleStatements: true,
        typeCast,
    })

    const insertBlocks = await Promise.all(
        tables.map(async (table) => {
            if (table.isView && !options.includeViewData) {
                // don't dump data for views
                return Promise.resolve({
                    ...table,
                    data: null,
                })
            }

            const selectAllRes = await connection.query<QueryRes>(`SELECT * FROM \`${table.name}\``)
            const inserts = buildInsert(selectAllRes, table)

            return {
                ...table,
                data: [
                    '# ------------------------------------------------------------',
                    `# DATA DUMP FOR TABLE: ${table.name}`,
                    '# ------------------------------------------------------------',
                    '',
                    inserts.join('\n'),
                    '',
                    '',
                ].join('\n'),
            }
        })
    )

    await connection.end()

    return insertBlocks
}
