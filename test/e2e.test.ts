import * as fs from 'fs'
import { promisify } from 'util'

import './scripts/initDb'
import testConfig from './testConfig'

import mysqldump from './scripts/import'
import { DumpOptions, SchemaDumpOptions, DataDumpOptions, TriggerDumpOptions } from '../src/interfaces/Options'

import Errors from '../src/Errors'

const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

describe('mysqldump.e2e', () => {
    function dumpOptTest<T>(
        type : 'schema' | 'data' | 'trigger',
        prop : keyof T,
        includeValue : any,
        excludeValue : any,
        matchRegExp : RegExp,
        dontMatchRegExp ?: RegExp
    ) {
        function createTest(include : boolean, value : any) {
            it(`should ${include ? 'include' : 'exclude'} ${prop} if configured`, async () => {
                // ACT
                const dumpOpt = {
                    [type]: {
                        [prop]: value,
                    },
                } as DumpOptions

                const res = await mysqldump({
                    connection: testConfig,
                    dump: dumpOpt,
                })

                // ASSERT
                if (include) {
                    expect(res.dump[type]).toMatch(matchRegExp)
                    dontMatchRegExp && expect(res.dump[type]).not.toMatch(dontMatchRegExp)
                } else {
                    dontMatchRegExp && expect(res.dump[type]).toMatch(dontMatchRegExp)
                    expect(res.dump[type]).not.toMatch(matchRegExp)
                }
            })
        }
        createTest(true, includeValue)
        createTest(false, excludeValue)
    }
    function dumpFlagTest<T>(
        type : 'schema' | 'data' | 'trigger',
        prop : keyof T,
        matchRegExp : RegExp,
        dontMatchRegExp ?: RegExp
    ) {
        return dumpOptTest<T>(type, prop, true, false, matchRegExp, dontMatchRegExp)
    }

    describe('dump opts', () => {
        it('should provide all dumps if no config provided', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
            })

            // ASSERT
            expect(res.dump.data).toBeTruthy()
            expect(res.dump.schema).toBeTruthy()
            expect(res.dump.trigger).toBeTruthy()
        })

        it('should not provide a schema dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                },
            })

            // ASSERT
            expect(res.dump.data).toBeTruthy()
            expect(res.dump.schema).toBeFalsy()
            expect(res.dump.trigger).toBeTruthy()
        })

        it('should not provide a data dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: false,
                },
            })

            // ASSERT
            expect(res.dump.data).toBeFalsy()
            expect(res.dump.schema).toBeTruthy()
            expect(res.dump.trigger).toBeTruthy()
        })

        it('should not provide a trigger dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    trigger: false,
                },
            })

            // ASSERT
            expect(res.dump.data).toBeTruthy()
            expect(res.dump.schema).toBeTruthy()
            expect(res.dump.trigger).toBeFalsy()
        })

        const tableListTest = (blacklist : boolean) => () => {
            // flip the expect function if testing the blacklist
            const jestExpect : jest.Expect = (global as any).expect
            const expect = blacklist
                ? (val : any) => jestExpect(val).not
                : (val : any) => jestExpect(val)
            const expectNot = blacklist
                ? (val : any) => jestExpect(val)
                : (val : any) => jestExpect(val).not

            it('single table', async () => {
                // ASSEMBLE
                const tables = ['geometry_types']

                // ACT
                const res = await mysqldump({
                    connection: testConfig,
                    dump: {
                        tables,
                        excludeTables: blacklist,
                    },
                })

                // ASSERT

                // assert for tables that should be there
                expect(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `geometry_types`/)
                expect(res.dump.data).toMatch(/INSERT INTO\n {2}`geometry_types`/)

                // assert for tables that shouldn't be there
                expectNot(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `date_types`/)
                expectNot(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `number_types`/)
                expectNot(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `other_types`/)
                expectNot(res.dump.schema).toMatch(/CREATE OR REPLACE .+ VIEW `everything`/)

                expectNot(res.dump.data).toMatch(/INSERT INTO\n {2}`date_types`/)
                expectNot(res.dump.data).toMatch(/INSERT INTO\n {2}`number_types`/)
                expectNot(res.dump.data).toMatch(/INSERT INTO\n {2}`other_types`/)
            })

            it('multiple tables', async () => {
                // ASSEMBLE
                const tables = ['date_types', 'geometry_types', 'everything']

                // ACT
                const res = await mysqldump({
                    connection: testConfig,
                    dump: {
                        tables,
                        excludeTables: blacklist,
                    },
                })

                // ASSERT

                // assert for tables that should be there
                expect(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `date_types`/)
                expect(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `geometry_types`/)
                expect(res.dump.schema).toMatch(/CREATE OR REPLACE .+ VIEW `everything`/)

                expect(res.dump.data).toMatch(/INSERT INTO\n {2}`geometry_types`/)
                expect(res.dump.data).toMatch(/INSERT INTO\n {2}`date_types`/)

                // assert for tables that shouldn't be there
                expectNot(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `number_types`/)
                expectNot(res.dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `other_types`/)

                expectNot(res.dump.data).toMatch(/INSERT INTO\n {2}`number_types`/)
                expectNot(res.dump.data).toMatch(/INSERT INTO\n {2}`other_types`/)
            })
        }
        describe('should whitelist tables if configured', tableListTest(false))
        describe('should blacklist tables if configured', tableListTest(true))

        describe('should error if invalid options are detected', () => {
            it('should error if no connection object', async () => {
                // ACT
                const prom = mysqldump({

                } as any)

                // ASSERT
                await expect(prom).rejects.toHaveProperty('message', Errors.MISSING_CONNECTION_CONFIG)
            })

            it('should error if no connection host', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: undefined,
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: 'invalid_password',
                    },
                } as any)

                // ASSERT
                await expect(prom).rejects.toHaveProperty('message', Errors.MISSING_CONNECTION_HOST)
            })

            it('should error if no connection database', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: undefined,
                        user: 'invalid_user',
                        password: 'invalid_password',
                    },
                } as any)

                // ASSERT
                await expect(prom).rejects.toHaveProperty('message', Errors.MISSING_CONNECTION_DATABASE)
            })

            it('should error if no connection user', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: undefined,
                        password: 'invalid_password',
                    },
                } as any)

                // ASSERT
                await expect(prom).rejects.toHaveProperty('message', Errors.MISSING_CONNECTION_USER)
            })

            it('should error if no connection password', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: undefined,
                    },
                } as any)

                // ASSERT
                await expect(prom).rejects.toHaveProperty('message', Errors.MISSING_CONNECTION_PASSWORD)
            })

            it('should NOT error if connection password is empty string', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: '',
                    },
                })

                // ASSERT
                // note that this should still reject because we're giving it invalid information
                // but it won't error withour error message
                await expect(prom).rejects.not.toHaveProperty('message', Errors.MISSING_CONNECTION_PASSWORD)
            })
        })
    })

    describe('schema dump opts', () => {
        dumpFlagTest<SchemaDumpOptions>('schema', 'autoIncrement', /AUTO_INCREMENT\s*=\s*\d+ /)
        dumpFlagTest<SchemaDumpOptions>('schema', 'engine', /ENGINE\s*=\s*\w+ /)
        dumpFlagTest<SchemaDumpOptions>('schema', 'tableDropIfExist', /DROP TABLE IF EXISTS `\w+`;\nCREATE TABLE/)
        dumpFlagTest<SchemaDumpOptions>('schema', 'tableIfNotExist', /CREATE TABLE IF NOT EXISTS/)
        dumpFlagTest<SchemaDumpOptions>('schema', 'viewCreateOrReplace', /CREATE OR REPLACE/)

        const regexBase = 'CREATE OR REPLACE ALGORITHM\\s?=\\s?\\w+ DEFINER\\s?=\\s?`.+?`\\s?@\\s?`.+?` SQL SECURITY DEFINER VIEW `everything` AS'
        const formattedRegEx = new RegExp(`${regexBase} select`)
        const unformattedRegEx = new RegExp(`${regexBase}\n`)
        dumpFlagTest<SchemaDumpOptions>('schema', 'format', unformattedRegEx, formattedRegEx)
    })

    describe('data dump opts', () => {
        dumpFlagTest<DataDumpOptions>('data', 'includeViewData', /INSERT INTO\n {2}`everything`/)
        dumpFlagTest<DataDumpOptions>('data', 'format', /INSERT INTO\n/, /INSERT INTO `\w+`/)

        dumpOptTest<DataDumpOptions>('data', 'where', {}, {
            // there shouldn't be more than 3 records...
            date_types: 'dt_id > 10',
        }, /INSERT INTO\n {2}`date_types`/)

        it('should return data from the call if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        returnFromFunction: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toBeFalsy()
        })
        it('should not return data from the call if not configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        returnFromFunction: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toBeFalsy()
        })

        it('should ignore foreign key checks if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        ignoreForeignKeyChecks: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(/^SET FOREIGN_KEY_CHECKS=0;$/gm)
            expect(res.dump.data).toMatch(/^SET FOREIGN_KEY_CHECKS=1;$/gm)
        })
        it('should not ignore foreign key checks if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        ignoreForeignKeyChecks: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(/^SET FOREIGN_KEY_CHECKS=0;$/gm)
            expect(res.dump.data).not.toMatch(/^SET FOREIGN_KEY_CHECKS=1;$/gm)
        })

        const singleInsertRegex = /^INSERT INTO `date_types` .+? VALUES \(([\d-:' ]+,?){6}\);$/gm
        const multiInsertRegex = /^INSERT INTO `date_types` .+? VALUES \(([\d-:' ]+,?){6}\)(,\(([\d-:' ]+,?){6}\))+;$/gm
        it('should keep the inserts as single statements if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    tables: ['date_types'],
                    schema: false,
                    data: {
                        maxRowsPerInsertStatement: 1,
                        format: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(singleInsertRegex)
            expect(res.dump.data).not.toMatch(multiInsertRegex)
        })
        it('should merge the inserts into multi insert statements if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    tables: ['date_types'],
                    schema: false,
                    data: {
                        maxRowsPerInsertStatement: 50,
                        format: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(multiInsertRegex)
            expect(res.dump.data).not.toMatch(singleInsertRegex)
        })
    })

    describe('trigger dump opts', () => {
        dumpFlagTest<TriggerDumpOptions>('trigger', 'dropIfExist', /DROP TRIGGER IF EXISTS/)
    })

    describe('dump to file', () => {
        const dumpTest = (opts : DumpOptions, extraAssertion ?: (file : string) => void) => async () => {
            // ASSEMBLE
            const filename = `${__dirname}/dump.sql`

            // force returning from function so we can check values
            if (opts.data !== false) {
                opts.data = {}
            }
            if (opts.data) {
                opts.data.returnFromFunction = true
            }

            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dumpToFile: filename,
                dump: opts,
            })
            const file = await readFile(filename, 'utf8')

            // remove the file
            await unlink(filename)

            // ASSERT
            const memoryLines = []
            res.dump.schema && memoryLines.push(`${res.dump.schema}\n`)
            res.dump.data && memoryLines.push(`${res.dump.data}\n`)
            res.dump.trigger && memoryLines.push(`${res.dump.trigger}\n`)
            memoryLines.push('') // need one extra newline to match the file dump

            expect(file).toEqual(memoryLines.join('\n'))
            extraAssertion && extraAssertion(file)
        }

        it('should dump a file if configured', dumpTest({}))
        it('should not dump schema to a file if configured', dumpTest({
            data: false,
        }))
        it('should not dump data to a file if configured', dumpTest({
            schema: false,
        }))
        it('should not dump trigger to a file if configured', dumpTest({
            trigger: false,
        }))

        describe('dump a consistent snapshot with options...', () => {
            const snapshotTest = (opts : DumpOptions) => {
                const testName = JSON.stringify(opts)
                it(testName, dumpTest(opts, file => expect(file).toMatchSnapshot(testName)))
            }

            snapshotTest({})
            snapshotTest({ data: false })
            snapshotTest({ data: { format: false } })
            snapshotTest({ data: { ignoreForeignKeyChecks: true } })
            snapshotTest({ data: { includeViewData: true } })
            snapshotTest({ data: { maxRowsPerInsertStatement: 1 } })
            snapshotTest({ data: { maxRowsPerInsertStatement: 2 } })
            snapshotTest({ data: { maxRowsPerInsertStatement: 3 } })

            snapshotTest({ schema: false })
            snapshotTest({ schema: { autoIncrement: false } })
            snapshotTest({ schema: { engine: false } })
            snapshotTest({ schema: { format: false } })
            snapshotTest({ schema: { tableDropIfExist: false, tableIfNotExist: true } })
            snapshotTest({ schema: { tableDropIfExist: true, tableIfNotExist: false } })

            snapshotTest({ trigger: false })
            snapshotTest({ trigger: { delimiter: false } })
            snapshotTest({ trigger: { delimiter: '//' } })
            snapshotTest({ trigger: { dropIfExist: false } })
        })
    })
})
