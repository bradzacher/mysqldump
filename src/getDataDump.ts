import * as fs from 'fs'
import * as mysql from 'mysql2'
import * as sqlformatter from 'sql-formatter'
import { all as merge } from 'deepmerge'

import { ConnectionOptions, DataDumpOptions } from './interfaces/Options'
import Table from './interfaces/Table'
import typeCast from './typeCast'


interface QueryRes {
    [k : string] : any
}

function buildInsert(row : QueryRes, table : Table, format : (s : string) => string) {
    const cols = Object.keys(row)

    const sql = format([
        `INSERT INTO \`${table.name}\` (\`${cols.join('`,`')}\`)`,
        `VALUES (${cols.map(c => row[c]).join(',')});`,
    ].join(' '))

    // sql-formatter lib doesn't support the X'aaff' or b'01010' literals, and it adds a space in and breaks them
    // this undoes the wrapping we did to get around the formatting
    return sql.replace(/NOFORMAT_WRAP\("##(.+?)##"\)/g, '$1')
}

// eslint-disable-next-line complexity
export default async function (connectionOptions : ConnectionOptions,
    options : DataDumpOptions,
    tables : Table[],
    dumpToFile : string | null) {
    // clone the array
    tables = [...tables] // eslint-disable-line no-param-reassign

    // build the format function if requested
    const format = options.format
        ? (sql : string) => sqlformatter.format(sql)
        : (sql : string) => sql

    // we open a new connection with a special typecast function for dumping data
    const connection = mysql.createConnection(merge<any>([connectionOptions, {
        multipleStatements: true,
        typeCast: typeCast(tables),
    }]))

    // open the write stream (if configured to)
    const outFileStream = dumpToFile ? fs.createWriteStream(dumpToFile, {
        flags: 'a', // append to the file
        encoding: 'utf8',
    }) : null
    const writeChunkToFile = dumpToFile
        ? (str : string) => {
            outFileStream!.write(str)
            outFileStream!.write('\n')
        }
        : () => {}

    const retTables : Table[] = []
    let currentTableLines : string[] | null = []

    // to avoid having to load an entire DB's worth of data at once, we select from each table individually
    // note that we use async/await within this loop to only process one table at a time (to reduce memory footprint)
    while (tables.length > 0) {
        const table = tables.shift()!

        if (table.isView && !options.includeViewData) {
            // don't dump data for views
            retTables.push(merge<Table>([table, {
                data: null,
            }]) as Table)

            continue
        }

        // write the table header to the file
        writeChunkToFile([
            '# ------------------------------------------------------------',
            `# DATA DUMP FOR TABLE: ${table.name}`,
            '# ------------------------------------------------------------',
            '',
        ].join('\n'))

        currentTableLines = options.returnFromFunction ? [] : null

        await new Promise((resolve, reject) => { // eslint-disable-line no-loop-func
            // send the query
            const where = options.where![table.name] ? ` WHERE ${options.where![table.name]}` : ''
            const query = connection.query(`SELECT * FROM \`${table.name}\`${where}`)

            // stream the data to the file
            query.on('result', (row : QueryRes) => {
                const insert = buildInsert(row, table, format)
                writeChunkToFile(insert)
                currentTableLines && currentTableLines.push(insert)
            })
            query.on('end', () => resolve())
            query.on('error', /* istanbul ignore next */err => reject(err))
        })

        // update the table definition
        retTables.push(merge<Table>([table, {
            data: currentTableLines ? currentTableLines.join('\n') : null,
        }]))

        writeChunkToFile('\n\n')
    }

    // clean up our connections
    await connection.end()
    outFileStream && outFileStream.close()

    return retTables
}
