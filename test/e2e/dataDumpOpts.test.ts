/* eslint-disable @typescript-eslint/camelcase */
import { dumpFlagTest, dumpOptTest } from './lib'
import { DataDumpOptions } from '../../src/interfaces/Options'
import mysqldump from '../scripts/import'
import testConfig from '../testConfig'

describe('mysqldump.e2e', () => {
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

        const singleInsertRegex = /^(INSERT INTO `multiline_insert_test` \(`id`\) VALUES \(\d\);\n?){3}$/m
        const multiInsertRegex = /^INSERT INTO `multiline_insert_test` \(`id`\) VALUES \(\d\),\(\d\),\(\d\);$/m
        it('should keep the inserts as single statements if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    tables: ['multiline_insert_test'],
                    schema: false,
                    trigger: false,
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
                    tables: ['multiline_insert_test'],
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

        const verboseHeaderRegex = /DATA DUMP FOR TABLE:/m
        it('should include table header if verbose is configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        maxRowsPerInsertStatement: 50,
                        format: false,
                        verbose: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(verboseHeaderRegex)
        })
        it('should not include table header if verbose is not configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        maxRowsPerInsertStatement: 50,
                        format: false,
                        verbose: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(verboseHeaderRegex)
        })

        const lockTableRegex = /DATA DUMP FOR TABLE: (.*) \(locked\)/m
        it('should lock tables if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        maxRowsPerInsertStatement: 50,
                        format: false,
                        verbose: true,
                        lockTables: true,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).toMatch(lockTableRegex)
        })
        it('should not lock tables if not configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    data: {
                        maxRowsPerInsertStatement: 50,
                        format: false,
                        verbose: true,
                        lockTables: false,
                    },
                },
            })

            // ASSERT
            expect(res.dump.data).not.toMatch(lockTableRegex)
        })
    })
})
