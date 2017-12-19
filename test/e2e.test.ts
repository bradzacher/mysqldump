import * as fs from 'fs'
import { promisify } from 'util'

import './scripts/initDb'
import testConfig from './testConfig'

import mysqldump from './scripts/import'
import { DumpOptions, SchemaDumpOptions } from '../src/interfaces/Options'

import Errors from '../src/Errors'

const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

describe('mysqldump.e2e', () => {
    describe('dump opts', () => {
        it('should provide both a schema dump and a data dump if no config provided', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
            })

            // ASSERT
            expect(res.dump.data).toBeDefined()
            expect(res.dump.schema).toBeDefined()
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
        function schemaOptTest(prop : keyof SchemaDumpOptions,
            matchRegExp : RegExp) {
            function createTest(include : boolean) {
                it(`should ${include ? 'include' : 'exclude'} ${prop} if configured`, async () => {
                    // ACT
                    const dumpOpt = {
                        schema: {
                            [prop]: include,
                        },
                    } as any

                    const res = await mysqldump({
                        connection: testConfig,
                        dump: dumpOpt,
                    })

                    // ASSERT
                    if (include) {
                        expect(res.dump.schema).toMatch(matchRegExp)
                    } else {
                        expect(res.dump.schema).not.toMatch(matchRegExp)
                    }
                })
            }
            createTest(true)
            createTest(false)
        }
        schemaOptTest('autoIncrement', /AUTO_INCREMENT\s*=\s*\d+ /)
        schemaOptTest('engine', /ENGINE\s*=\s*\w+ /)
        schemaOptTest('tableDropIfExist', /DROP TABLE IF EXISTS `\w+`;\nCREATE TABLE/)
        schemaOptTest('tableIfNotExist', /CREATE TABLE IF NOT EXISTS/)
        schemaOptTest('viewCreateOrReplace', /CREATE OR REPLACE/)

        // ASSEMBLE
        const regexBase = 'CREATE OR REPLACE ALGORITHM\\s?=\\s?\\w+ DEFINER\\s?=\\s?`.+?`\\s?@\\s?`.+?` SQL SECURITY DEFINER VIEW `everything` AS'
        const formattedRegEx = new RegExp(`${regexBase} select`)
        const unformattedRegEx = new RegExp(`${regexBase}\n`)

        it('should format if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: false,
                    schema: {
                        format: true,
                        viewCreateOrReplace: true,
                    },
                    // mysql will auto format a create table statement...
                    // so we test this based on the create view statement
                    tables: ['everything'],
                },
            })

            // ASSERT
            expect(res.dump.schema).not.toMatch(formattedRegEx)
            expect(res.dump.schema).toMatch(unformattedRegEx)
        })

        it('should not format if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: false,
                    schema: {
                        format: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.schema).toMatch(formattedRegEx)
            expect(res.dump.schema).not.toMatch(unformattedRegEx)
        })
    })

    describe('data dump opts', () => {
        it('should include view data if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        includeViewData: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(/INSERT INTO\n {2}`everything`/)
        })
        it('should exclude view data if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        includeViewData: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(/INSERT INTO\n {2}`everything`/)
        })

        it('should handle where if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    tables: ['date_types'],
                    data: {
                        where: {
                            // there shouldn't be more than 3 records...
                            date_types: 'dt_id > 10',
                        },
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(/INSERT INTO\n {2}`date_types`/)
        })

        it('should format if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        format: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(/INSERT INTO `\w+`/)
            expect(res.dump.data).toMatch(/INSERT INTO\n/)
        })
        it('should not format if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                    data: {
                        format: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(/INSERT INTO `\w+`/)
            expect(res.dump.data).not.toMatch(/INSERT INTO\n/)
        })

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
    })

    describe('dump to file', () => {
        const dumpTest = (opts : DumpOptions) => async () => {
            // ASSEMBLE
            const filename = `${__dirname}/dump.sql`

            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dumpToFile: filename,
                dump: opts,
            })
            const fileProm = readFile(filename, 'utf8')

            // ASSERT
            await expect(fileProm).resolves.toBeDefined()
            const file = await fileProm
            expect(file).toEqual(`${res.dump.schema || ''}\n${res.dump.data || ''}\n`)

            // remove the file
            await unlink(filename)
        }

        it('should dump a file if configured', dumpTest({}))
        it('should dump not dump schema to a file if configured', dumpTest({
            data: false,
        }))
        it('should dump not dump data to a file if configured', dumpTest({
            schema: false,
        }))
    })
})
