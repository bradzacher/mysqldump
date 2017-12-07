import * as sqlformatter from 'sql-formatter'

import { SchemaDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'
import DB from './DB'

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

export default async function (connection : DB, options : SchemaDumpOptions, tables : Table[]) {
    const format = options.format ?
        (sql : string) => sqlformatter.format(sql) :
        (sql : string) => sql

    // we create a multi query here so we can query all at once rather than in individual connections
    const getSchemaMultiQuery = tables.map(t => `SHOW CREATE TABLE \`${t.name}\`;`).join('\n')
    const createStatements = (await connection.multiQuery<ShowCreateTableStatementRes>(getSchemaMultiQuery))
        // mysql2 returns an array of arrays which will all have our one row
        .map(r => r[0])
        .map((res, i) => {
            const table = tables[i]
            if (isCreateView(res)) {
                return {
                    name: res.View,
                    schema: format(res['Create View']),
                    data: null,
                    isView: true,
                    columns: table.columns,
                }
            }

            return {
                name: res.Table,
                schema: format(res['Create Table']),
                data: null,
                isView: false,
                columns: table.columns,
            }
        })
        .map<Table>((s) => {
            // clean up the generated SQL as per the options

            if (!options.autoIncrement) {
                s.schema = s.schema.replace(/AUTO_INCREMENT\s*=\s*\d+ /g, '')
            }
            if (!options.engine) {
                s.schema = s.schema.replace(/ENGINE\s*=\s*\w+ /, '')
            }
            if (s.isView) {
                if (options.viewCreateOrReplace) {
                    s.schema = s.schema.replace(
                        /^CREATE/,
                        'CREATE OR REPLACE'
                    )
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (options.tableDropIfExist) {
                    s.schema = s.schema.replace(
                        /^CREATE TABLE/,
                        `DROP TABLE IF EXISTS \`${s.name}\`;\nCREATE TABLE`
                    )
                } else if (options.tableIfNotExist) {
                    s.schema = s.schema.replace(
                        /^CREATE TABLE/,
                        'CREATE TABLE IF NOT EXISTS'
                    )
                }
            }

            // add a semicolon to separate schemas
            s.schema += ';'

            // pad the sql with a header
            s.schema = [
                '# ------------------------------------------------------------',
                `# SCHEMA DUMP FOR TABLE: ${s.name}`,
                '# ------------------------------------------------------------',
                '',
                s.schema,
                '',
                '',
            ].join('\n')

            return s
        })
        // sort the schemas so that everything is always in a consistent order
        .sort((a, b) => a.name.localeCompare(b.name, 'en-us'))

    return createStatements
}
