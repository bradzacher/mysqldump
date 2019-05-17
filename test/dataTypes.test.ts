import { config } from './testConfig';

import { mysqldump } from './scripts/import';

describe('insert data types', () => {
    function typeTest(
        tableName: string,
        format: boolean,
        assertion: (values: string) => void,
    ): () => Promise<void> {
        return async () => {
            // ASSEMBLE
            const insertRegex = new RegExp(
                format
                    ? `INSERT INTO  \`${tableName}\` \\(.+?\\)VALUES  \\((.+)\\)`
                    : `INSERT INTO \`${tableName}\` \\(.+?\\) VALUES \\((.+)\\)`,
            );

            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    tables: [tableName],
                    schema: false,
                    data: {
                        format,
                    },
                },
            });

            const lines = format
                ? res.dump
                      .data! // remove the newlines to compact each insert
                      .replace(/\n/g, '')
                      // add a newline after each insert
                      .replace(/;/g, ';\n')
                      // handle comments
                      .replace(/#/g, '\n#')
                      .split('\n')
                : res.dump.data!.split('\n');

            const inserts = lines
                .map(sql => insertRegex.exec(sql))
                .filter(match => !!match)
                .map(match => match![1]);

            // ASSERT
            expect(lines.length).toBeGreaterThan(0);
            expect(inserts.length).toBeGreaterThan(0);
            inserts.forEach(matches => {
                assertion(matches);
            });
        };
    }

    function dateTypeTest(matches: string): void {
        const values = matches.split(',').map(v => v.trim());

        for (let i = 0; i < 6; i += 1) {
            expect(values[i]).not.toContain('00');
        }
        expect(values[0]).toMatch(/^\d$/);
        expect(values[1]).toMatch(/^'\d{4}-\d{2}-\d{2}'$/);
        expect(values[2]).toMatch(/^'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'$/);
        expect(values[3]).toMatch(/^'\d{2}:\d{2}:\d{2}'$/);
        expect(values[4]).toMatch(/^'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'$/);
        expect(values[5]).toMatch(/^'\d{4}'$/);

        // nulled columns
        expect(values[6]).toMatch(/^NULL$/);
        expect(values[7]).toMatch(/^NULL$/);
        expect(values[8]).toMatch(/^NULL$/);
        expect(values[9]).toMatch(/^'0000-00-00 00:00:00'$/);
        expect(values[10]).toMatch(/^NULL$/);
    }
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump date types correctly - formatted',
        typeTest('date_types', true, dateTypeTest),
    );
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump date types correctly - unformatted',
        typeTest('date_types', false, dateTypeTest),
    );

    it(
        'should dump geometry types correctly',
        typeTest('geometry_types', false, values => {
            // to make these strings a little cleaner with less backslashes, we use <>'s instead of \\(\\) in the strings
            function geomfromtext(type: string, secondComma = true): RegExp {
                type = type.replace(/</g, '\\(').replace(/>/g, '\\)');

                return new RegExp(
                    `,GeomFromText\\('${type}'\\)${secondComma ? ',' : ''}`,
                );
            }

            expect(values).toMatch(/^\d,/);
            expect(values).toMatch(geomfromtext('POINT<\\d+ \\d+>'));
            expect(values).toMatch(geomfromtext('LINESTRING<(\\d+ \\d+,?)+>'));
            expect(values).toMatch(
                geomfromtext('POLYGON<(<(\\d+ \\d+,?)+>,?)+?>'),
            );
            expect(values).toMatch(geomfromtext('MULTIPOINT<(\\d+ \\d+,?)+>'));
            expect(values).toMatch(
                geomfromtext('MULTILINESTRING<(<(\\d+ \\d+,?)+>,?)+?>'),
            );
            expect(values).toMatch(
                geomfromtext('MULTIPOLYGON<(<(<(\\d+ \\d+,?)+>,?)+>,?)+>'),
            );
            // this test will be specific to how we structured our test data because otherwise the regex will get too long
            expect(values).toMatch(
                geomfromtext(
                    [
                        'GEOMETRYCOLLECTION<',
                        'POINT<\\d+ \\d+>,',
                        'LINESTRING<(\\d+ \\d+,?)+>,',
                        'MULTIPOLYGON<(<(<(\\d+ \\d+,?)+>,?)+>,?)+>',
                        '>',
                    ].join(''),
                    false,
                ),
            );

            // null values
            expect(values).toMatch(/NULL,NULL,NULL,NULL,NULL,NULL,NULL/);
        }),
    );

    function numberTypesTest(matches: string): void {
        const values = matches.split(',').map(v => v.trim());

        let i = 0;
        /* eslint-disable no-plusplus */
        expect(values[i++]).toMatch(/^\d$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+$/);
        expect(values[i++]).toMatch(/^\d+\.\d+$/);
        expect(values[i++]).toMatch(/^\d+\.\d+$/);
        expect(values[i++]).toMatch(/^\d+\.\d+$/);
        expect(values[i++]).toMatch(/^\d+\.\d+$/);
        expect(values[i++]).toMatch(/^b'[10]+'$/);
        expect(values[i++]).toMatch(/^b'[10]+'$/);
        expect(values[i++]).toMatch(/^b'0'$/);
        expect(values[i++]).toMatch(/^b'1'$/);

        // null values
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        /* eslint-enable no-plusplus */
    }
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump number types correctly - formatted',
        typeTest('number_types', true, numberTypesTest),
    );
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump number types correctly - unformatted',
        typeTest('number_types', false, numberTypesTest),
    );

    function textTypesTest(matches: string): void {
        const values = matches.split(',').map(v => v.trim());

        expect(values[0]).toMatch(/^\d$/);
        expect(values[1]).toMatch(/^'.'$/);
        expect(values[2]).toMatch(/^'.+'$/);
        expect(values[3]).toMatch(/^'.+'$/);
        expect(values[4]).toMatch(/^'.+'$/);

        // null types
        expect(values[5]).toMatch(/^NULL$/);
        expect(values[6]).toMatch(/^NULL$/);
        expect(values[7]).toMatch(/^NULL$/);
        expect(values[8]).toMatch(/^NULL$/);
    }
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump text types correctly - formatted',
        typeTest('text_types', true, textTypesTest),
    );
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump text types correctly - unformatted',
        typeTest('text_types', false, textTypesTest),
    );

    function otherTypesTest(matches: string): void {
        const values = matches.split(',').map(v => v.trim());

        let i = 0;
        /* eslint-disable no-plusplus */
        expect(values[i++]).toMatch(/^\d$/);
        // check for correct hex formatting
        expect(values[i++]).toMatch(/^X'0\d0\d'$/);
        expect(values[i++]).toMatch(/^X'[0-9a-fA-F]+'$/);
        expect(values[i++]).toMatch(/^X'[0-9a-fA-F]+'$/);
        expect(values[i++]).toMatch(/^X'[0-9a-fA-F]+'$/);
        expect(values[i++]).toMatch(/^X'[0-9a-fA-F]+'$/);
        expect(values[i++]).toMatch(/^X'[0-9a-fA-F]+'$/);
        expect(values[i++]).toMatch(/^'(red|green|blue)'$/);
        expect(values[i++]).toMatch(/^'[abc]'$/);
        expect(values[i++]).toMatch(/^NULL$/);
        i++; // populated via trigger - don't care

        // null types
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        expect(values[i++]).toMatch(/^NULL$/);
        /* eslint-enable no-plusplus */
    }
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump "other" types correctly - formatted',
        typeTest('other_types', true, otherTypesTest),
    );
    // eslint-disable-next-line jest/expect-expect
    it(
        'should dump "other" types correctly - unformatted',
        typeTest('other_types', false, otherTypesTest),
    );
});
