import { dumpFlagTest } from './lib';
import { TriggerDumpOptions } from '../../src/interfaces/Options';

describe('mysqldump.e2e', () => {
    describe('trigger dump opts', () => {
        dumpFlagTest<TriggerDumpOptions>(
            'trigger',
            'dropIfExist',
            /DROP TRIGGER IF EXISTS/,
        );
        dumpFlagTest<TriggerDumpOptions>(
            'trigger',
            'definer',
            /CREATE DEFINER/,
            /CREATE TRIGGER/,
        );
    });
});
