import * as fs from 'fs'
import * as assert from 'assert'
import * as extend from 'extend'
import * as mysql from 'mysql2/promise'

import { Options, CompletedOptions } from './interfaces/Options'
import getTables from './getTables'
import getSchemaDump from './getSchemaDump'
import getDataDump from './getDataDump'
import typeCast from './typeCast'

const defaultOptions : CompletedOptions = {
    connection: {
        host: 'localhost',
        port: 3306,
        user: '',
        password: '',
        database: '',
    },
    dump: {
        tables: [],
        schema: {
            autoIncrement: true,
            engine: true,
            tableDropIfExist: true,
            tableIfNotExist: false,
            viewCreateOrReplace: true,
        },
        data: {
            where: {},
        },
    },
    dumpToFile: null,
}

export interface Dump {
    schema ?: string,
    data ?: string,
}

export default async function main(inputOptions : Options) {
    // assert the given options have all the required properties
    assert(inputOptions.connection, 'Expected to be given `connection` options.')
    assert(inputOptions.connection.host, 'Expected to be given `host` connection option.')
    assert(inputOptions.connection.user, 'Expected to be given `user` connection option.')
    // note that you can have empty string passwords, hence the type assertion
    assert(typeof inputOptions.connection.password === 'string', 'Expected to be given `password` connection option.')

    const options : CompletedOptions = extend(true, {}, defaultOptions, inputOptions)

    // make sure the port is a number
    options.connection.port = parseInt(options.connection.port as any, 10)

    const connection = await mysql.createConnection({
        ...options.connection,
        multipleStatements: true,
        typeCast,
    })

    // list the tables
    let tables = (await getTables(connection, options.connection.database, options.dump.tables!))

    const dump : Dump = {}

    // dump the schema if requested
    if (options.dump.schema !== false) {
        tables = await getSchemaDump(connection, options.dump.schema!, tables)

        const dumpLines : string[] = []
        tables.forEach((t) => {
            dumpLines.push(t.sql)
        })
        dump.schema = dumpLines.join('\n')
    }

    // dump data if requested
    if (options.dump.data !== false) {
        dump.data = await getDataDump(connection, options.dump.data!, tables)
    }

    const clob = [
        dump.data || '',
        dump.schema || '',
        '',
    ].join('\n')

    if (options.dumpToFile) {
        fs.writeFileSync(options.dumpToFile, clob)
    }

    return dump
}
