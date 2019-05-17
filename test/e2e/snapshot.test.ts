import { dumpTest } from './lib';
import { DumpOptions } from '../../src/interfaces/Options';

describe('mysqldump.e2e', () => {
    describe('dump a consistent snapshot with options...', () => {
        function snapshotTest(opts: DumpOptions): void {
            const testName = JSON.stringify(opts);
            it(
                testName,
                dumpTest(opts, file => expect(file).toMatchSnapshot(testName)),
            );
        }

        snapshotTest({});
        snapshotTest({ data: false });
        snapshotTest({ data: { format: false } });
        snapshotTest({ data: { includeViewData: true } });
        snapshotTest({ data: { maxRowsPerInsertStatement: 1 } });
        snapshotTest({ data: { maxRowsPerInsertStatement: 2 } });
        snapshotTest({ data: { maxRowsPerInsertStatement: 3 } });

        snapshotTest({ schema: false });
        snapshotTest({ schema: { autoIncrement: false } });
        snapshotTest({ schema: { engine: false } });
        snapshotTest({ schema: { format: false } });
        snapshotTest({
            schema: { table: { dropIfExist: false, ifNotExist: true } },
        });
        snapshotTest({
            schema: { table: { dropIfExist: true, ifNotExist: false } },
        });
        snapshotTest({ schema: { view: { algorithm: true } } });
        snapshotTest({ schema: { view: { createOrReplace: false } } });
        // TODO - figure out how to make this run and pass on both local and travis
        // snapshotTest({ schema: { view: { definer: true } } })
        snapshotTest({ schema: { view: { sqlSecurity: true } } });

        snapshotTest({ trigger: false });
        snapshotTest({ trigger: { delimiter: false } });
        snapshotTest({ trigger: { delimiter: '//' } });
        snapshotTest({ trigger: { dropIfExist: false } });
        // TODO - figure out how to make this run and pass on both local and travis
        // snapshotTest({ trigger: { definer: true } })
    });
});
