import * as mysql from 'mysql2/promise'
import * as fs from 'fs'
import { promisify } from 'util'

import testConfig from './testConfig'

import mysqldump from '../src/main'
import { DumpOptions, SchemaDumpOptions, DataDumpOptions } from '../src/interfaces/Options'

const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

beforeAll(async () => {
    // setup the database

    const conn = await mysql.createConnection({
        ...testConfig,
        multipleStatements: true,
    })

    const schema = await readFile(`${__dirname}/schema.sql`, 'utf8')
    const data = await readFile(`${__dirname}/data.sql`, 'utf8')

    await conn.query(schema)
    await conn.query(data)

    await conn.end()
})

describe('mysqldump.e2e', () => {
    describe('dump opts', () => {
        it('should provide both a schema dump and a data dump if no config provided', async () => {
            // ACT
            const dump = await mysqldump({
                connection: testConfig,
            })

            // ASSERT
            expect(dump.data).toBeDefined()
            expect(dump.schema).toBeDefined()
        })

        it('should not provide a schema dump if configured', async () => {
            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dump: {
                    schema: false,
                },
            })

            // ASSERT
            expect(dump.data).toBeDefined()
            expect(dump.schema).toBeUndefined()
        })

        it('should not provide a data dump if configured', async () => {
            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dump: {
                    data: false,
                },
            })

            // ASSERT
            expect(dump.data).toBeUndefined()
            expect(dump.schema).toBeDefined()
        })

        it('should filter tables if configured', async () => {
            // ASSEMBLE
            const tables = ['geometry_types', 'everything']

            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dump: {
                    tables
                },
            })

            // ASSERT

            // assert for tables that should be there
            expect(dump.schema).toMatch(/CREATE TABLE IF NOT EXISTS `geometry_types`/)
            expect(dump.schema).toMatch(/CREATE OR REPLACE .+ VIEW `everything`/)

            expect(dump.data).toMatch(/INSERT INTO\n {2}`geometry_types`/)

            // assert for tables that shouldn't be there
            expect(dump.schema).not.toMatch(/CREATE TABLE IF NOT EXISTS `date_types`/)
            expect(dump.schema).not.toMatch(/CREATE TABLE IF NOT EXISTS `number_types`/)
            expect(dump.schema).not.toMatch(/CREATE TABLE IF NOT EXISTS `other_types`/)

            expect(dump.data).not.toMatch(/INSERT INTO\n {2}`date_types`/)
            expect(dump.data).not.toMatch(/INSERT INTO\n {2}`number_types`/)
            expect(dump.data).not.toMatch(/INSERT INTO\n {2}`other_types`/)
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

                    const dump = await mysqldump({
                        connection: testConfig,
                        dump: dumpOpt,
                    })

                    // ASSERT
                    if (include) {
                        expect(dump.schema).toMatch(matchRegExp)
                    } else {
                        expect(dump.schema).not.toMatch(matchRegExp)
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
    })

    describe('data dump opts', () => {
        it('should include view data if configured', async () => {
            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        includeViewData: true,
                    },
                },
            })

            // ASSERT
            expect(dump.data).toMatch(/INSERT INTO\n {2}`everything`/)
        })
        it('should exclude view data if configured', async () => {
            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        includeViewData: false,
                    },
                },
            })

            // ASSERT
            expect(dump.data).not.toMatch(/INSERT INTO\n {2}`everything`/)
        })

        it('should handle where if configured', async () => {
            // ACT
            const dump = await mysqldump({
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
            expect(dump.data).not.toMatch(/INSERT INTO\n {2}`date_types`/)
        })
    })

    describe('dump to file', () => {
        const dumpTest = (opts : DumpOptions) => async () => {
            // ASSEMBLE
            const filename = `${__dirname}/dump.sql`

            // ACT
            const dump = await mysqldump({
                connection: testConfig,
                dumpToFile: filename,
                dump: opts,
            })
            const fileProm = readFile(filename, 'utf8')

            // ASSERT
            await expect(fileProm).resolves.toBeDefined()
            const file = await fileProm
            expect(file).toEqual(`${dump.schema || ''}\n${dump.data || ''}\n`)

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
