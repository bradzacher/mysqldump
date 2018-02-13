import * as fs from 'fs'
import { all as merge } from 'deepmerge'

import { Options, CompletedOptions, DataDumpOptions } from './interfaces/Options'
import DumpReturn from './interfaces/DumpReturn'
import getTables from './getTables'
import getSchemaDump from './getSchemaDump'
import getTriggerDump from './getTriggerDump'
import getDataDump from './getDataDump'
import DB from './DB'
import Errors from './Errors'
import { HEADER_VARIABLES, FOOTER_VARIABLES } from './sessionVariables'

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
            returnFromFunction: false,
            maxRowsPerInsertStatement: 1,
        },
        trigger: {
            delimiter: ';;',
            dropIfExist: true,
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

        // if not dumping to file and not otherwise configured, set returnFromFunction to true.
        if (!options.dumpToFile) {
            const hasValue = inputOptions.dump
                && inputOptions.dump.data
                && inputOptions.dump.data.returnFromFunction !== undefined
            if (options.dump.data && !hasValue) {
                (options.dump.data as DataDumpOptions).returnFromFunction = true
            }
        }

        // make sure the port is a number
        options.connection.port = parseInt(options.connection.port as any, 10)

        // write to the destination file (i.e. clear it)
        if (options.dumpToFile) {
            fs.writeFileSync(options.dumpToFile, '')
        }

        // write the initial headers
        if (options.dumpToFile) {
            fs.appendFileSync(options.dumpToFile, `${HEADER_VARIABLES}\n`)
        }

        connection = await DB.connect(merge<any>([options.connection, { multipleStatements: true }]))

        // list the tables
        const res : DumpReturn = {
            dump: {
                schema: null,
                data: null,
                trigger: null,
            },
            tables: (await getTables(
                connection,
                options.connection.database,
                options.dump.tables!,
                options.dump.excludeTables!
            )),
        }

        // dump the schema if requested
        if (options.dump.schema !== false) {
            res.tables = await getSchemaDump(connection, options.dump.schema!, res.tables)
            res.dump.schema = res.tables.map(t => t.schema).filter(t => t).join('\n').trim()
        }

        // write the schema to the file
        if (options.dumpToFile && res.dump.schema) {
            fs.appendFileSync(options.dumpToFile, `${res.dump.schema}\n\n`)
        }

        // dump the triggers if requested
        if (options.dump.trigger !== false) {
            res.tables = await getTriggerDump(
                connection,
                options.connection.database,
                options.dump.trigger!,
                res.tables
            )
            res.dump.trigger = res.tables.map(t => t.triggers.join('\n')).filter(t => t).join('\n').trim()
        }

        // data dump uses its own connection so kill ours
        await connection.end()

        // dump data if requested
        if (options.dump.data !== false) {
            // don't even try to run the data dump
            res.tables = await getDataDump(options.connection, options.dump.data!, res.tables, options.dumpToFile)
            res.dump.data = res.tables.map(t => t.data).filter(t => t).join('\n').trim()
        }

        // write the triggers to the file
        if (options.dumpToFile && res.dump.trigger) {
            fs.appendFileSync(options.dumpToFile, `${res.dump.trigger}\n\n`)
        }

        // reset all of the variables
        if (options.dumpToFile) {
            fs.appendFileSync(options.dumpToFile, FOOTER_VARIABLES)
        }

        return res
    } finally {
        DB.cleanup()
    }
}

// a hacky way to make the package work with both require and ES modules
(main as any).default = main
