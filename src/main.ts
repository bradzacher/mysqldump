import * as fs from 'fs'
import { all as merge } from 'deepmerge'

import { Options, CompletedOptions } from './interfaces/Options'
import DumpReturn from './interfaces/DumpReturn'
import getTables from './getTables'
import getSchemaDump from './getSchemaDump'
import getDataDump from './getDataDump'
import DB from './DB'
import Errors from './Errors'

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
        excludeTables: false,
        schema: {
            format: true,
            autoIncrement: true,
            engine: true,
            tableIfNotExist: true,
            tableDropIfExist: false,
            viewCreateOrReplace: true,
        },
        data: {
            format: true,
            includeViewData: false,
            where: {},
            returnFromFunction: true,
            ignoreForeignKeyChecks: false,
        },
    },
    dumpToFile: null,
}

function assert(condition : any, message : string) {
    if (!condition) {
        throw new Error(message)
    }
}

// eslint-disable-next-line complexity
export default async function main(inputOptions : Options) {
    let connection
    try {
        // assert the given options have all the required properties
        assert(inputOptions.connection, Errors.MISSING_CONNECTION_CONFIG)
        assert(inputOptions.connection.host, Errors.MISSING_CONNECTION_HOST)
        assert(inputOptions.connection.database, Errors.MISSING_CONNECTION_DATABASE)
        assert(inputOptions.connection.user, Errors.MISSING_CONNECTION_USER)
        // note that you can have empty string passwords, hence the type assertion
        assert(typeof inputOptions.connection.password === 'string', Errors.MISSING_CONNECTION_PASSWORD)

        const options : CompletedOptions = merge([defaultOptions, inputOptions])

        // make sure the port is a number
        options.connection.port = parseInt(options.connection.port as any, 10)

        connection = await DB.connect(merge<any>([options.connection, { multipleStatements: true }]))

        // list the tables
        const res : DumpReturn = {
            dump: {
                schema: '',
                data: '',
            },
            tables: (await getTables(connection, options.connection.database, options.dump.tables!, options.dump.excludeTables!)),
        }

        // dump the schema if requested
        if (options.dump.schema !== false) {
            res.tables = await getSchemaDump(connection, options.dump.schema!, res.tables)
            res.dump.schema = res.tables.map(t => t.schema).filter(t => t).join('\n')
        } else {
            res.dump.schema = null
        }

        // data dump uses its own connection so kill ours
        await connection.end()

        // write the schema to the file now so the data can be stream in as its received
        if (options.dumpToFile) {
            fs.writeFileSync(options.dumpToFile, res.dump.schema || '')
        }

        // dump data if requested
        if (options.dump.data !== false) {
            // don't even try to run the data dump
            res.tables = await getDataDump(options.connection, options.dump.data!, res.tables, options.dumpToFile)
            res.dump.data = res.tables.map(t => t.data).filter(t => t).join('\n')

            if (res.dump.data && options.dump.data!.ignoreForeignKeyChecks) {
                res.dump.data = `SET FOREIGN_KEY_CHECKS=0;\n${res.dump.data}\nSET FOREIGN_KEY_CHECKS=1;\n`
            }
        } else {
            res.dump.data = null
        }

        if (options.dumpToFile) {
            const clob = [
                res.dump.schema || '',
                res.dump.data || '',
                '',
            ].join('\n')
            fs.writeFileSync(options.dumpToFile, clob)
        }

        return res
    } finally {
        DB.cleanup()
    }
}
