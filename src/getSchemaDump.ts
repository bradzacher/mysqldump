import { IPromiseConnection } from 'mysql2/promise'
import * as sqlformatter from 'sql-formatter'

import { SchemaDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'

export interface ShowCreateView {
    View : string
    'Create View' : string
    character_set_client : string // eslint-disable-line camelcase
    collation_connection : string // eslint-disable-line camelcase
}
export interface ShowCreateTable {
    Table : string
    'Create Table' : string
}
export type ShowCreateTableStatementRes = ShowCreateView | ShowCreateTable

function isCreateView(v : any) : v is ShowCreateView {
    return 'View' in v
}

export default async function (connection : IPromiseConnection, options : SchemaDumpOptions, tables : Table[]) {
    // we create a multi query here so we can query all at once rather than in individual connections
    const getSchemaMultiQuery = tables.map(t => `SHOW CREATE TABLE \`${t.name}\`;`).join('\n')
    const createStatements = (await connection.query<ShowCreateTableStatementRes[]>(getSchemaMultiQuery))[0]
        // mysql2 returns an array of arrays which will all have our one row
        .map(r => r[0] || r) // mysql2 will return a single record if our multi statement only has one statement
        .map<Table>((res) => {
            if (isCreateView(res)) {
                return {
                    name: res.View,
                    sql: sqlformatter.format(res['Create View']),
                    isView: true,
                }
            }

            return {
                name: res.Table,
                sql: sqlformatter.format(res['Create Table']),
                isView: false,
            }
        })
        .map((s) => {
            // clean up the generated SQL as per the options

            if (!options.autoIncrement) {
                s.sql = s.sql.replace(/AUTO_INCREMENT\s*=\s*\d+ /g, '')
            }
            if (!options.engine) {
                s.sql = s.sql.replace(/ENGINE\s*=\s*\w+ /, '')
            }
            if (s.isView) {
                if (options.viewCreateOrReplace) {
                    s.sql = s.sql.replace(
                        /^CREATE/,
                        'CREATE OR REPLACE'
                    )
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (options.tableDropIfExist) {
                    s.sql = s.sql.replace(
                        /^CREATE TABLE/,
                        `DROP TABLE IF EXISTS \`${s.name}\`;\nCREATE TABLE`
                    )
                } else if (options.tableIfNotExist) {
                    s.sql = s.sql.replace(
                        /^CREATE TABLE/,
                        'CREATE TABLE IF NOT EXISTS'
                    )
                }
            }

            // add a semicolon to separate schemas
            s.sql += ';'

            // pad the sql with a header
            s.sql = [
                '# ------------------------------------------------------------',
                `# SCHEMA DUMP FOR TABLE: ${s.name}`,
                '# ------------------------------------------------------------',
                '',
                s.sql,
                '',
                '',
            ].join('\n')

            return s
        })
        // sort the schemas so that everything is always in a consistent order
        .sort((a, b) => a.name.localeCompare(b.name, 'en-us'))

    return createStatements
}
