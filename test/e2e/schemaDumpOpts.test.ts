import { dumpFlagTest } from './lib'
import { SchemaDumpOptions } from '../../src/interfaces/Options'

describe('mysqldump.e2e', () => {
    describe('schema dump opts', () => {
        dumpFlagTest<SchemaDumpOptions>('schema', 'autoIncrement', /AUTO_INCREMENT\s*=\s*\d+ /)
        dumpFlagTest<SchemaDumpOptions>('schema', 'engine', /ENGINE\s*=\s*\w+ /)
        dumpFlagTest<SchemaDumpOptions>('schema', ['table', 'dropIfExist'], /DROP TABLE IF EXISTS `\w+`;\nCREATE TABLE/)
        dumpFlagTest<SchemaDumpOptions>('schema', ['table', 'ifNotExist'], /CREATE TABLE IF NOT EXISTS/)
        dumpFlagTest<SchemaDumpOptions>('schema', ['table', 'charset'], /CHARSET = latin1/)
        dumpFlagTest<SchemaDumpOptions>('schema', ['view', 'createOrReplace'], /CREATE OR REPLACE/)
        dumpFlagTest<SchemaDumpOptions>('schema', ['view', 'algorithm'], /CREATE OR REPLACE ALGORITHM = UNDEFINED/)
        dumpFlagTest<SchemaDumpOptions>('schema', ['view', 'definer'], /CREATE OR REPLACE.+?DEFINER = /)
        dumpFlagTest<SchemaDumpOptions>('schema', ['view', 'sqlSecurity'], /CREATE OR REPLACE.+?SQL SECURITY DEFINER/)

        const regexBase = 'CREATE OR REPLACE VIEW `everything` AS'
        const formattedRegEx = new RegExp(`${regexBase} select`)
        const unformattedRegEx = new RegExp(`${regexBase}\n`)
        dumpFlagTest<SchemaDumpOptions>('schema', 'format', unformattedRegEx, formattedRegEx)
    })
})
