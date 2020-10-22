import * as fs from 'fs';
import * as tmp from 'tmp';
import * as zlib from 'zlib';

import { DumpOptions, SchemaDumpOptions } from '../../src/interfaces/Options';
import { config } from '../testConfig';
import { mysqldump } from '../scripts/import';

import { HEADER_VARIABLES, FOOTER_VARIABLES } from '../../src/sessionVariables';

type TableProp = keyof Required<SchemaDumpOptions>['table'];
type ViewProp = keyof Required<SchemaDumpOptions>['view'];
type PropType = ['table', TableProp] | ['view', ViewProp];
// eslint-disable-next-line max-params
function dumpOptTest<T>(
    type: 'schema' | 'data' | 'trigger',
    prop: keyof T | PropType,
    includeValue: any,
    excludeValue: any,
    matchRegExp: RegExp,
    dontMatchRegExp?: RegExp,
): void {
    function createTest(include: boolean, value: any): void {
        it(`should ${
            include ? 'include' : 'exclude'
        } ${prop} if configured`, async () => {
            // ACT
            const dumpOpt: DumpOptions =
                typeof prop !== 'string'
                    ? {
                          [type]: {
                              [(prop as PropType)[0]]: {
                                  [(prop as PropType)[1]]: value,
                              },
                          },
                      }
                    : {
                          [type]: {
                              [prop]: value,
                          },
                      };

            const res = await mysqldump({
                connection: config,
                dump: dumpOpt,
            });

            // ASSERT
            if (include) {
                expect(res.dump[type]).toMatch(matchRegExp);
                dontMatchRegExp &&
                    expect(res.dump[type]).not.toMatch(dontMatchRegExp);
            } else {
                dontMatchRegExp &&
                    expect(res.dump[type]).toMatch(dontMatchRegExp);
                expect(res.dump[type]).not.toMatch(matchRegExp);
            }
        });
    }
    createTest(true, includeValue);
    createTest(false, excludeValue);
}

function dumpFlagTest<T>(
    type: 'schema' | 'data' | 'trigger',
    prop: keyof T | PropType,
    matchRegExp: RegExp,
    dontMatchRegExp?: RegExp,
): void {
    dumpOptTest<T>(type, prop, true, false, matchRegExp, dontMatchRegExp);
}

function dumpTest(
    opts: DumpOptions,
    extraAssertion?: (file: string) => void,
    compressFile?: boolean,
    asWritableStream?: boolean,
): () => void {
    return async () => {
        // ASSEMBLE
        const tmpFile = tmp.fileSync();
        const filename = tmpFile.name;

        // force returning from function so we can check values
        if (opts.data !== false) {
            opts.data = {};
        }
        if (opts.data) {
            opts.data.returnFromFunction = true;
        }

        const dumpToFile = asWritableStream
            ? fs.createWriteStream(filename)
            : filename;

        // ACT
        const res = await mysqldump({
            connection: config,
            dumpToFile,
            compressFile,
            dump: opts,
        });

        let file: string;
        if (compressFile) {
            const f = fs.readFileSync(filename);
            file = zlib.gunzipSync(f).toString('utf8');
        } else {
            file = fs.readFileSync(filename, 'utf8');
        }

        // remove the file
        fs.unlinkSync(filename);

        // ASSERT
        const memoryLines = [];
        memoryLines.push(HEADER_VARIABLES);
        res.dump.schema && memoryLines.push(`${res.dump.schema}\n`);
        res.dump.data && memoryLines.push(`${res.dump.data}\n`);
        res.dump.trigger && memoryLines.push(`${res.dump.trigger}\n`);
        memoryLines.push(FOOTER_VARIABLES);

        expect(file).toEqual(memoryLines.join('\n'));
        extraAssertion && extraAssertion(file);
    };
}

export { dumpOptTest, dumpFlagTest, dumpTest };
