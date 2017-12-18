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
        },
    },
    dumpToFile: null,
}

function assert(condition : any, message : string) {
    if (!condition) {
        throw new Error(message)
    }
}

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
            tables: (await getTables(connection, options.connection.database, options.dump.tables!)),
        }

        // dump the schema if requested
        if (options.dump.schema !== false) {
            res.tables = await getSchemaDump(connection, options.dump.schema!, res.tables)
            res.dump.schema = res.tables.map(t => t.schema).filter(t => t).join('\n')
        } else {
            res.dump.schema = null
        }

        await connection.end()

        // dump data if requested
        if (options.dump.data !== false) {
            res.tables = await getDataDump(options.connection, options.dump.data!, res.tables)
            res.dump.data = res.tables.map(t => t.data).filter(t => t).join('\n')
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