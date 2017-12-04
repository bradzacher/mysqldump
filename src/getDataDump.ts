import { IPromiseConnection, IQueryReturn } from 'mysql2/promise'
import * as sqlformatter from 'sql-formatter'

import { DataDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'

interface QueryRes {
    [k : string] : any
}

function buildInsert(result : IQueryReturn<QueryRes>, table : Table) {
    const cols = result[1].map(f => f.name)

    const sqlLines = result[0].map(row => sqlformatter.format([
        `INSERT INTO \`${table.name}\` (\`${cols.join('`,`')}\`)`,
        `VALUES (${cols.map(c => row[c]).join('m')});`,
    ].join(' ')))

    return sqlLines
}

export default async function (connection : IPromiseConnection, options : DataDumpOptions, tables : Table[]) {
    const insertBlocks = await Promise.all(
        tables.map(async (table) => {
            if (table.isView && !options.includeViewData) {
                // don't dump data for views
                return Promise.resolve({
                    table,
                    sql: false,
                })
            }

            const selectAllRes = await connection.query<QueryRes>(`SELECT * FROM \`${table.name}\``)
            const inserts = buildInsert(selectAllRes, table)

            return {
                table,
                sql: [
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

    return insertBlocks
        // remove tables with no data
        .filter(b => !!b.sql)
        // sort by table name to make sure it always comes out in the same order
        .sort((a, b) => a.table.name.localeCompare(b.table.name, 'en-us'))
        .join('\n')
}
