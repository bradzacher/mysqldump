import * as stream from 'stream';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { all as merge } from 'deepmerge';

import {
    Options,
    CompletedOptions,
    DataDumpOptions,
} from './interfaces/Options';
import { DumpReturn } from './interfaces/DumpReturn';
import { getTables } from './getTables';
import { getSchemaDump } from './getSchemaDump';
import { getTriggerDump } from './getTriggerDump';
import { getDataDump } from './getDataDump';
import { DB } from './DB';
import { ERRORS } from './Errors';
import { HEADER_VARIABLES, FOOTER_VARIABLES } from './sessionVariables';

const defaultOptions: Options = {
    connection: {
        host: 'localhost',
        port: 3306,
        user: '',
        password: '',
        database: '',
        charset: 'UTF8_GENERAL_CI',
        ssl: null,
    },
    dump: {
        tables: [],
        excludeTables: false,
        schema: {
            format: true,
            autoIncrement: true,
            engine: true,
            table: {
                ifNotExist: true,
                dropIfExist: false,
                charset: true,
            },
            view: {
                createOrReplace: true,
                algorithm: false,
                definer: false,
                sqlSecurity: false,
            },
        },
        data: {
            format: true,
            verbose: true,
            lockTables: false,
            includeViewData: false,
            where: {},
            returnFromFunction: false,
            maxRowsPerInsertStatement: 1,
        },
        trigger: {
            delimiter: ';;',
            dropIfExist: true,
            definer: false,
        },
    },
    dumpToFile: null,
};

function assert(condition: unknown, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

// eslint-disable-next-line complexity, import/no-default-export
export default async function main(inputOptions: Options): Promise<DumpReturn> {
    let connection;
    try {
        // assert the given options have all the required properties
        assert(inputOptions.connection, ERRORS.MISSING_CONNECTION_CONFIG);
        assert(inputOptions.connection.host, ERRORS.MISSING_CONNECTION_HOST);
        assert(
            inputOptions.connection.database,
            ERRORS.MISSING_CONNECTION_DATABASE,
        );
        assert(inputOptions.connection.user, ERRORS.MISSING_CONNECTION_USER);
        // note that you can have empty string passwords, hence the type assertion
        assert(
            typeof inputOptions.connection.password === 'string',
            ERRORS.MISSING_CONNECTION_PASSWORD,
        );

        const options = merge([
            defaultOptions,
            inputOptions,
        ]) as CompletedOptions;
        options.dumpToFile = inputOptions.dumpToFile as stream.Writable;

        // if not dumping to file and not otherwise configured, set returnFromFunction to true.
        if (!options.dumpToFile) {
            const hasValue =
                inputOptions.dump &&
                inputOptions.dump.data &&
                inputOptions.dump.data.returnFromFunction !== undefined;
            if (options.dump.data && !hasValue) {
                (options.dump
                    .data as DataDumpOptions).returnFromFunction = true;
            }
        }

        // make sure the port is a number
        options.connection.port = parseInt(`${options.connection.port}`, 10);

        if (typeof options.dumpToFile === 'string') {
            options.dumpToFile = fs.createWriteStream(options.dumpToFile);
        }

        if (options.dumpToFile && options.compressFile) {
            const destinationFile = options.dumpToFile;
            options.dumpToFile = zlib.createGzip();
            options.dumpToFile.pipe(destinationFile);
        }

        // write the initial headers
        if (options.dumpToFile) {
            options.dumpToFile.write(`${HEADER_VARIABLES}\n`);
        }

        connection = await DB.connect(
            merge([options.connection, { multipleStatements: true }]),
        );

        // list the tables
        const res: DumpReturn = {
            dump: {
                schema: null,
                data: null,
                trigger: null,
            },
            tables: await getTables(
                connection,
                options.connection.database,
                options.dump.tables,
                options.dump.excludeTables,
            ),
        };

        // dump the schema if requested
        if (options.dump.schema !== false) {
            const tables = res.tables;
            res.tables = await getSchemaDump(
                connection,
                options.dump.schema,
                tables,
            );
            res.dump.schema = res.tables
                .map(t => t.schema)
                .filter(t => t)
                .join('\n')
                .trim();
        }

        // write the schema to the file
        if (options.dumpToFile && res.dump.schema) {
            options.dumpToFile.write(`${res.dump.schema}\n\n`);
        }

        // dump the triggers if requested
        if (options.dump.trigger !== false) {
            const tables = res.tables;
            res.tables = await getTriggerDump(
                connection,
                options.connection.database,
                options.dump.trigger,
                tables,
            );
            res.dump.trigger = res.tables
                .map(t => t.triggers.join('\n'))
                .filter(t => t)
                .join('\n')
                .trim();
        }

        // data dump uses its own connection so kill ours
        await connection.end();

        // dump data if requested
        if (options.dump.data !== false) {
            // don't even try to run the data dump
            const tables = res.tables;
            res.tables = await getDataDump(
                options.connection,
                options.dump.data,
                tables,
                options.dumpToFile,
            );
            res.dump.data = res.tables
                .map(t => t.data)
                .filter(t => t)
                .join('\n')
                .trim();
        }

        // write the triggers to the file
        if (options.dumpToFile && res.dump.trigger) {
            options.dumpToFile.write(`${res.dump.trigger}\n\n`);
        }

        // reset all of the variables
        if (options.dumpToFile) {
            options.dumpToFile.write(FOOTER_VARIABLES);
        }

        // tidy up the file stream, making sure writes are 100% flushed before continuing
        await new Promise(resolve => {
            if (options.dumpToFile) {
                options.dumpToFile.once('finish', () => {
                    resolve();
                });
                options.dumpToFile.end();
            } else {
                resolve();
            }
        });

        return res;
    } finally {
        DB.cleanup();
    }
}

// a hacky way to make the package work with both require and ES modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(main as any).default = main;
