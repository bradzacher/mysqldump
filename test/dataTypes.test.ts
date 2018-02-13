import './scripts/initDb'
import testConfig from './testConfig'

import mysqldump from './scripts/import'

describe('insert data types', () => {
    function typeTest(tableName : string, format : boolean, assertion : (values : string) => void) {
        return async () => {
            // ASSEMBLE
            const insertRegex = new RegExp(format ?
                `INSERT INTO  \`${tableName}\` \\(.+?\\)VALUES  \\((.+)\\)` :
                `INSERT INTO \`${tableName}\` \\(.+?\\) VALUES \\((.+)\\)`)

            // ACT
            const res = await mysqldump({
                connection: testConfig,
                dump: {
                    tables: [tableName],
                    schema: false,
                    data: {
                        format,
                    },
                },
            })

            const lines = format ?
                res.dump.data!
                    // remove the newlines to compact each insert
                    .replace(/\n/g, '')
                    // add a newline after each insert
                    .replace(/;/g, ';\n')
                    // handle comments
                    .replace(/#/g, '\n#')
                    .split('\n') :
                res.dump.data!
                    .split('\n')

            const inserts = lines
                .map(sql => sql.match(insertRegex))
                .filter(match => !!match)
                .map(match => match![1])

            // ASSERT
            expect(lines.length).toBeGreaterThan(0)
            expect(inserts.length).toBeGreaterThan(0)
            inserts.forEach((matches) => {
                assertion(matches)
            })
        }
    }

    const dateTypeTest = (matches : string) => {
        const values = matches.split(',')
            .map(v => v.trim())

        for (let i = 0; i < 6; i += 1) {
            expect(values[i]).not.toContain('00')
        }
        expect(values[0]).toMatch(/^\d$/)
        expect(values[1]).toMatch(/^'\d{4}-\d{2}-\d{2}'$/)
        expect(values[2]).toMatch(/^'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'$/)
        expect(values[3]).toMatch(/^'\d{2}:\d{2}:\d{2}'$/)
        expect(values[4]).toMatch(/^'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'$/)
        expect(values[5]).toMatch(/^'\d{4}'$/)

        // nulled columns
        expect(values[6]).toMatch(/^NULL$/)
        expect(values[7]).toMatch(/^NULL$/)
        expect(values[8]).toMatch(/^NULL$/)
        expect(values[9]).toMatch(/^'0000-00-00 00:00:00'$/)
        expect(values[10]).toMatch(/^NULL$/)
    }
    it('should dump date types correctly - formatted', typeTest('date_types', true, dateTypeTest))
    it('should dump date types correctly - unformatted', typeTest('date_types', false, dateTypeTest))

    it('should dump geometry types correctly', typeTest('geometry_types', false, (values) => {
        // to make these strings a little cleaner with less backslashes, we use <>'s instead of \\(\\) in the strings
        const geomfromtext = (type : string, secondComma = true) => {
            type = type.replace(/</g, '\\(').replace(/>/g, '\\)')

            return new RegExp(`,GeomFromText\\('${type}'\\)${secondComma ? ',' : ''}`)
        }

        expect(values).toMatch(/^\d,/)
        expect(values).toMatch(geomfromtext('POINT<\\d+ \\d+>'))
        expect(values).toMatch(geomfromtext('LINESTRING<(\\d+ \\d+,?)+>'))
        expect(values).toMatch(geomfromtext('POLYGON<(<(\\d+ \\d+,?)+>,?)+?>'))
        expect(values).toMatch(geomfromtext('MULTIPOINT<(\\d+ \\d+,?)+>'))
        expect(values).toMatch(geomfromtext('MULTILINESTRING<(<(\\d+ \\d+,?)+>,?)+?>'))
        expect(values).toMatch(geomfromtext('MULTIPOLYGON<(<(<(\\d+ \\d+,?)+>,?)+>,?)+>'))
        // this test will be specific to how we structured our test data because otherwise the regex will get too long
        expect(values).toMatch(geomfromtext([
            'GEOMETRYCOLLECTION<',
            'POINT<\\d+ \\d+>,',
            'LINESTRING<(\\d+ \\d+,?)+>,',
            'MULTIPOLYGON<(<(<(\\d+ \\d+,?)+>,?)+>,?)+>',
            '>',
        ].join(''), false))

        // null values
        expect(values).toMatch(/NULL,NULL,NULL,NULL,NULL,NULL,NULL/)
    }))

    const numberTypesTest = (matches : string) => {
        const values = matches.split(',')
            .map(v => v.trim())

        expect(values[0]).toMatch(/^\d$/)
        expect(values[1]).toMatch(/^\d+$/)
        expect(values[2]).toMatch(/^\d+$/)
        expect(values[3]).toMatch(/^\d+$/)
        expect(values[4]).toMatch(/^\d+$/)
        expect(values[5]).toMatch(/^\d+$/)
        expect(values[6]).toMatch(/^\d+$/)
        expect(values[7]).toMatch(/^\d+\.\d+$/)
        expect(values[8]).toMatch(/^\d+\.\d+$/)
        expect(values[9]).toMatch(/^\d+\.\d+$/)
        expect(values[10]).toMatch(/^\d+\.\d+$/)
        expect(values[11]).toMatch(/^b'[10]+'$/)
        expect(values[12]).toMatch(/^b'[10]+'$/)

        // null values
        expect(values[13]).toMatch(/^NULL$/)
        expect(values[14]).toMatch(/^NULL$/)
        expect(values[15]).toMatch(/^NULL$/)
        expect(values[16]).toMatch(/^NULL$/)
        expect(values[17]).toMatch(/^NULL$/)
        expect(values[18]).toMatch(/^NULL$/)
        expect(values[19]).toMatch(/^NULL$/)
        expect(values[20]).toMatch(/^NULL$/)
        expect(values[21]).toMatch(/^NULL$/)
        expect(values[22]).toMatch(/^NULL$/)
        expect(values[23]).toMatch(/^NULL$/)
        expect(values[24]).toMatch(/^NULL$/)
    }
    it('should dump number types correctly - formatted', typeTest('number_types', true, numberTypesTest))
    it('should dump number types correctly - unformatted', typeTest('number_types', false, numberTypesTest))

    const textTypesTest = (matches : string) => {
        const values = matches.split(',')
            .map(v => v.trim())

        expect(values[0]).toMatch(/^\d$/)
        expect(values[1]).toMatch(/^'.'$/)
        expect(values[2]).toMatch(/^'.+'$/)
        expect(values[3]).toMatch(/^'.+'$/)
        expect(values[4]).toMatch(/^'.+'$/)

        // null types
        expect(values[5]).toMatch(/^NULL$/)
        expect(values[6]).toMatch(/^NULL$/)
        expect(values[7]).toMatch(/^NULL$/)
        expect(values[8]).toMatch(/^NULL$/)
    }
    it('should dump text types correctly - formatted', typeTest('text_types', true, textTypesTest))
    it('should dump text types correctly - unformatted', typeTest('text_types', false, textTypesTest))

    const otherTypesTest = (matches : string) => {
        const values = matches.split(',')
            .map(v => v.trim())

        expect(values[0]).toMatch(/^\d$/)
        expect(values[1]).toMatch(/^X'[0-9a-fA-F]+'$/)
        expect(values[2]).toMatch(/^X'[0-9a-fA-F]+'$/)
        expect(values[3]).toMatch(/^X'[0-9a-fA-F]+'$/)
        expect(values[4]).toMatch(/^'(red|green|blue)'$/)
        expect(values[5]).toMatch(/^'[abc]'$/)
        expect(values[6]).toMatch(/^NULL$/)

        // null types
        expect(values[9]).toMatch(/^NULL$/)
        expect(values[10]).toMatch(/^NULL$/)
        expect(values[11]).toMatch(/^NULL$/)
        expect(values[12]).toMatch(/^NULL$/)
        expect(values[13]).toMatch(/^NULL$/)
    }
    it('should dump "other" types correctly - formatted', typeTest('other_types', true, otherTypesTest))
    it('should dump "other" types correctly - unformatted', typeTest('other_types', false, otherTypesTest))
})
