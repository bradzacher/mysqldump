import * as fs from 'fs'

import { DumpOptions, SchemaDumpOptions, DataDumpOptions, TriggerDumpOptions } from '../../src/interfaces/Options'
import testConfig from '../testConfig'
import mysqldump from '../scripts/import'

import { HEADER_VARIABLES, FOOTER_VARIABLES } from '../../src/sessionVariables'

export function dumpOptTest<T>(
    type : 'schema' | 'data' | 'trigger',
    prop : keyof T | ['table', keyof SchemaDumpOptions['table']] | ['view', keyof SchemaDumpOptions['view']],
    includeValue : any,
    excludeValue : any,
    matchRegExp : RegExp,
    dontMatchRegExp ?: RegExp
) {
    function createTest(include : boolean, value : any) {
        it(`should ${include ? 'include' : 'exclude'} ${prop} if configured`, async () => {
            // ACT
            const dumpOpt = typeof prop !== 'string' ? {
                [type]: {
                    [prop[0]]: {
                        [prop[1]]: value,
                    },
                },
            } : {
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

export function dumpFlagTest<T>(
    type : 'schema' | 'data' | 'trigger',
    prop : keyof T | ['table', keyof SchemaDumpOptions['table']] | ['view', keyof SchemaDumpOptions['view']],
    matchRegExp : RegExp,
    dontMatchRegExp ?: RegExp
) {
    return dumpOptTest<T>(type, prop, true, false, matchRegExp, dontMatchRegExp)
}

export function dumpTest(opts : DumpOptions, extraAssertion ?: (file : string) => void) {
    return async () => {
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
        const file = fs.readFileSync(filename, 'utf8')

        // remove the file
        fs.unlinkSync(filename)

        // ASSERT
        const memoryLines = []
        memoryLines.push(HEADER_VARIABLES)
        res.dump.schema && memoryLines.push(`${res.dump.schema}\n`)
        res.dump.data && memoryLines.push(`${res.dump.data}\n`)
        res.dump.trigger && memoryLines.push(`${res.dump.trigger}\n`)
        memoryLines.push(FOOTER_VARIABLES)

        expect(file).toEqual(memoryLines.join('\n'))
        extraAssertion && extraAssertion(file)
    }
}
