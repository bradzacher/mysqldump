import { Table, ColumnList } from './interfaces/Table'
import DB from './DB'

interface ShowTableRes {
    Table_type : 'BASE TABLE' | 'VIEW' // eslint-disable-line camelcase

    [k : string] : string
}

interface ShowColumnsRes {
    Field : string
    Type : string
    Null : 'YES' | 'NO'
    Key : string
    Default : string | null
    Extra : string
}

export default async function (connection : DB, dbName : string, restrictedTables : string[], restrictedTablesIsBlacklist : boolean) {
    // list the tables
    const showTablesKey = `Tables_in_${dbName}`
    const tablesRes = (await connection.query<ShowTableRes>(`SHOW FULL TABLES FROM ${dbName}`))
    const actualTables = tablesRes.map<Table>(r => ({
        name: r[showTablesKey].replace(/'/g, ''),
        schema: null,
        data: null,
        isView: r.Table_type === 'VIEW',
        columns: {},
        columnsOrdered: [],
        triggers: [],
    }))

    let tables = actualTables
    if (restrictedTables.length > 0) {
        if (restrictedTablesIsBlacklist) {
            // exclude the tables from the options that actually exist in the db
            tables = tables.filter(t => restrictedTables.indexOf(t.name) === -1)
        } else {
            // only include the tables from the options that actually exist in the db
            tables = tables.filter(t => restrictedTables.indexOf(t.name) !== -1)
        }
    }


    // get the column definitions
    const columnsMultiQuery = tables.map(t => `SHOW COLUMNS FROM \`${t.name}\` FROM \`${dbName}\`;`).join('\n')
    const columns = (await connection.multiQuery<ShowColumnsRes>(columnsMultiQuery))

    columns.forEach((cols, i) => {
        tables[i].columns = cols.reduce((acc, c) => {
            acc[c.Field] = {
                type: c.Type
                    // split to remove things like 'unsigned' from the string
                    .split(' ')[0]
                    // split to remove the lengths
                    .split('(')[0]
                    .toLowerCase(),
                nullable: c.Null === 'YES',
            }

            return acc
        }, {} as ColumnList)
        tables[i].columnsOrdered = cols.map(c => c.Field)
    })


    return tables
}
