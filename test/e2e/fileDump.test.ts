/* eslint-disable jest/expect-expect */
import { dumpTest } from './lib';

describe('mysqldump.e2e', () => {
    describe('dump to file', () => {
        it('should dump a file if configured', dumpTest({}));
        it(
            'should not dump data to a file if configured',
            dumpTest({
                data: false,
            }),
        );
        it(
            'should not dump schema to a file if configured',
            dumpTest({
                schema: false,
            }),
        );
        it(
            'should not dump trigger to a file if configured',
            dumpTest({
                trigger: false,
            }),
        );
        it(
            'should not dump procedure to a file if configured',
            dumpTest({
                procedure: false,
            }),
        );
        it(
            'should dump a file in compressed format if configured',
            dumpTest({}, undefined, /* compressFile */ true),
        );
    });
});
