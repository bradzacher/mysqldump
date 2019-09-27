import { dumpFlagTest } from './lib';
import { ProcedureDumpOptions } from '../../src/interfaces/Options';

describe('mysqldump.e2e', () => {
    describe('procedure dump opts', () => {
        dumpFlagTest<ProcedureDumpOptions>(
            'procedure',
            'dropIfExist',
            /DROP PROCEDURE IF EXISTS/,
        );
        dumpFlagTest<ProcedureDumpOptions>(
            'procedure',
            'definer',
            /CREATE DEFINER/,
            /CREATE PROCEDURE/,
        );
    });
});
