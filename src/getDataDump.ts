import { IQueryReturn, createConnection } from 'mysql2/promise'
import * as sqlformatter from 'sql-formatter'

import { ConnectionOptions, DataDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'
import typeCast from './typeCast'

interface QueryRes {
    [k : string] : any
}

function buildInsert(result : IQueryReturn<QueryRes>, table : Table, format : (s : string) => string) {
    const cols = result[1].map(f => f.name)

    const sqlLines = result[0].map((row) => {
        const sql = format([
            `INSERT INTO \`${table.name}\` (\`${cols.join('`,`')}\`)`,
            `VALUES (${cols.map(c => row[c]).join(',')});`,
        ].join(' '))

        // sql-formatter lib doesn't support the X'aaff' or b'01010' literals, and it adds a space in and breaks them
        // this undoes the wrapping we did to get around the formatting
        return sql.replace(/NOFORMAT_WRAP\("##(.+?)##"\)/g, '$1')
    })

    return sqlLines
}

export default async function (connectionOptions : ConnectionOptions, options : DataDumpOptions, tables : Table[]) {
    const format = options.format ?
        (sql : string) => sqlformatter.format(sql) :
        (sql : string) => sql

    // we open a new connection with a special typecast function for dumping data
    const connection = await createConnection({
        ...connectionOptions,
        multipleStatements: true,
        typeCast: typeCast(tables),
    })

    // to avoid having to load an entire DB's worth of data at once, we select from each table individually
    const insertBlocks = await Promise.all(
        tables.map<Promise<Table>>(async (table) => {
            if (table.isView && !options.includeViewData) {
                // don't dump data for views
                return Promise.resolve({
                    ...table,
                    data: null,
                })
            }

            const selectAllRes = await connection.query<QueryRes>(`SELECT * FROM \`${table.name}\``)
            const inserts = buildInsert(selectAllRes, table, format)

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
