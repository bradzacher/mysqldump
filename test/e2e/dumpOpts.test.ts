import { mysqldump } from '../scripts/import';
import { config } from '../testConfig';
import { ERRORS } from '../../src/Errors';

describe('mysqldump.e2e', () => {
    describe('dump opts', () => {
        it('should provide all dumps if no config provided', async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
            });

            // ASSERT
            expect(res.dump.data).toBeTruthy();
            expect(res.dump.schema).toBeTruthy();
            expect(res.dump.trigger).toBeTruthy();
            expect(res.dump.procedure).toBeTruthy();
        });

        it('should not provide a schema dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    schema: false,
                },
            });

            // ASSERT
            expect(res.dump.data).toBeTruthy();
            expect(res.dump.schema).toBeFalsy();
            expect(res.dump.trigger).toBeTruthy();
            expect(res.dump.procedure).toBeTruthy();
        });

        it('should not provide a data dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    data: false,
                },
            });

            // ASSERT
            expect(res.dump.data).toBeFalsy();
            expect(res.dump.schema).toBeTruthy();
            expect(res.dump.trigger).toBeTruthy();
            expect(res.dump.procedure).toBeTruthy();
        });

        it('should not provide a trigger dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    trigger: false,
                },
            });

            // ASSERT
            expect(res.dump.data).toBeTruthy();
            expect(res.dump.schema).toBeTruthy();
            expect(res.dump.trigger).toBeFalsy();
            expect(res.dump.procedure).toBeTruthy();
        });

        it('should not provide a procedure dump if configured', async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    procedure: false,
                },
            });

            // ASSERT
            expect(res.dump.data).toBeTruthy();
            expect(res.dump.schema).toBeTruthy();
            expect(res.dump.trigger).toBeTruthy();
            expect(res.dump.procedure).toBeFalsy();
        });

        function tableListTest(blacklist: boolean): () => void {
            return () => {
                // flip the expect function if testing the blacklist
                const jestExpect: jest.Expect = (global as any).expect;
                const expect = blacklist
                    ? (val: any) => jestExpect(val).not
                    : (val: any) => jestExpect(val);
                const expectNot = blacklist
                    ? (val: any) => jestExpect(val)
                    : (val: any) => jestExpect(val).not;

                it('single table', async () => {
                    // ASSEMBLE
                    const tables = ['geometry_types'];

                    // ACT
                    const res = await mysqldump({
                        connection: config,
                        dump: {
                            tables,
                            excludeTables: blacklist,
                        },
                    });

                    // ASSERT

                    // assert for tables that should be there
                    expect(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `geometry_types`/,
                    );
                    expect(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`geometry_types`/,
                    );

                    // assert for tables that shouldn't be there
                    expectNot(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `date_types`/,
                    );
                    expectNot(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `number_types`/,
                    );
                    expectNot(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `other_types`/,
                    );
                    expectNot(res.dump.schema).toMatch(
                        /CREATE OR REPLACE .*VIEW `everything`/,
                    );

                    expectNot(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`date_types`/,
                    );
                    expectNot(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`number_types`/,
                    );
                    expectNot(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`other_types`/,
                    );
                });

                it('multiple tables', async () => {
                    // ASSEMBLE
                    const tables = [
                        'date_types',
                        'geometry_types',
                        'everything',
                    ];

                    // ACT
                    const res = await mysqldump({
                        connection: config,
                        dump: {
                            tables,
                            excludeTables: blacklist,
                        },
                    });

                    // ASSERT

                    // assert for tables that should be there
                    expect(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `date_types`/,
                    );
                    expect(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `geometry_types`/,
                    );
                    expect(res.dump.schema).toMatch(
                        /CREATE OR REPLACE .*VIEW `everything`/,
                    );

                    expect(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`geometry_types`/,
                    );
                    expect(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`date_types`/,
                    );

                    // assert for tables that shouldn't be there
                    expectNot(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `number_types`/,
                    );
                    expectNot(res.dump.schema).toMatch(
                        /CREATE TABLE IF NOT EXISTS `other_types`/,
                    );

                    expectNot(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`number_types`/,
                    );
                    expectNot(res.dump.data).toMatch(
                        /INSERT INTO\n {2}`other_types`/,
                    );
                });
            };
        }
        // eslint-disable-next-line jest/valid-describe
        describe('should whitelist tables if configured', tableListTest(false));
        // eslint-disable-next-line jest/valid-describe
        describe('should blacklist tables if configured', tableListTest(true));

        describe('should error if invalid options are detected', () => {
            it('should error if no connection object', async () => {
                // ACT
                const prom = mysqldump({} as any);

                // ASSERT
                await expect(prom).rejects.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_CONFIG,
                );
            });

            it('should error if no connection host', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: undefined,
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: 'invalid_password',
                    },
                } as any);

                // ASSERT
                await expect(prom).rejects.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_HOST,
                );
            });

            it('should error if no connection database', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: undefined,
                        user: 'invalid_user',
                        password: 'invalid_password',
                    },
                } as any);

                // ASSERT
                await expect(prom).rejects.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_DATABASE,
                );
            });

            it('should error if no connection user', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: undefined,
                        password: 'invalid_password',
                    },
                } as any);

                // ASSERT
                await expect(prom).rejects.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_USER,
                );
            });

            it('should error if no connection password', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: undefined,
                    },
                } as any);

                // ASSERT
                await expect(prom).rejects.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_PASSWORD,
                );
            });

            it('should NOT error if connection password is empty string', async () => {
                // ACT
                const prom = mysqldump({
                    connection: {
                        host: 'invalid_host',
                        database: 'invalid_database',
                        user: 'invalid_user',
                        password: '',
                    },
                });

                // ASSERT
                // note that this should still reject because we're giving it invalid information
                // but it won't error withour error message
                await expect(prom).rejects.not.toHaveProperty(
                    'message',
                    ERRORS.MISSING_CONNECTION_PASSWORD,
                );
            });
        });
    });
});
