import { Table, Column } from './interfaces/Table'
import DB from './DB'

interface ShowTableRes {
    Table_type : 'BASE TABLE' | 'VIEW' // eslint-disable-line camelcase

    [k : string] : string
}

export default async function (connection : DB, dbName : string, restrictedTables : string[]) {
    // list the tables
    const showTablesKey = `Tables_in_${dbName}`
    const tablesRes = (await connection.query<ShowTableRes>(`SHOW FULL TABLES FROM ${dbName}`))
    const actualTables = tablesRes.map<Table>(r => ({
        name: r[showTablesKey].replace(/'/g, ''),
        schema: null,
        data: null,
        isView: r.Table_type === 'VIEW',
    }))

    let tables = actualTables
    if (restrictedTables.length > 0) {
        // grab all of the tables from the options that actually exist in the db
        tables = tables.filter(t => restrictedTables.indexOf(t.name) !== -1)
    }

    return tables
}
