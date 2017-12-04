import { TypecastField } from 'mysql2/promise'
import * as sqlstring from 'sqlstring'

// adapted from https://github.com/mysqljs/mysql/blob/master/lib/protocol/Parser.js
// changes:
// - cleaned up to use const/let + types
// - reduced duplication
// - made it return a string rather than an object/array
function parseGeometryValue(buffer : Buffer) {
    let offset = 4

    const geomConstructors = {
        1: 'POINT',
        2: 'LINESTRING',
        3: 'POLYGON',
        4: 'MULTIPOINT',
        5: 'MULTILINESTRING',
        6: 'MULTIPOLYGON',
        7: 'GEOMETRYCOLLECTION',
    }

    function readDouble(byteOrder : number) {
        const val = byteOrder ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset)
        offset += 8

        return val
    }
    function readUInt32(byteOrder : number) {
        const val = byteOrder ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset)
        offset += 4

        return val
    }

    // eslint-disable-next-line complexity
    function parseGeometry() {
        let result : string[] = []

        const byteOrder = buffer.readUInt8(offset)
        offset += 1

        const wkbType = readUInt32(byteOrder)

        switch (wkbType) {
            case 1: { // WKBPoint - POINT(1 1)
                const x = readDouble(byteOrder)
                const y = readDouble(byteOrder)
                result.push(`${x} ${y}`)
                break
            }

            case 2: { // WKBLineString - LINESTRING(0 0,1 1,2 2)
                const numPoints = readUInt32(byteOrder)
                result = []
                for (let i = numPoints; i > 0; i--) {
                    const x = readDouble(byteOrder)
                    const y = readDouble(byteOrder)
                    result.push(`${x} ${y}`)
                }
                break
            }

            case 3: { // WKBPolygon - POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5))
                const numRings = readUInt32(byteOrder)
                result = []
                for (let i = numRings; i > 0; i--) {
                    const numPoints = readUInt32(byteOrder)
                    const line : string[] = []
                    for (let j = numPoints; j > 0; j--) {
                        const x = readDouble(byteOrder)
                        const y = readDouble(byteOrder)
                        line.push(`${x} ${y}`)
                    }
                    result.push(`(${line.join(',')})`)
                }
                break
            }

            case 4: // WKBMultiPoint
            case 5: // WKBMultiLineString
            case 6: // WKBMultiPolygon
            case 7: { // WKBGeometryCollection - GEOMETRYCOLLECTION(POINT(1 1),LINESTRING(0 0,1 1,2 2,3 3,4 4))
                const num = readUInt32(byteOrder)
                result = []
                for (let i = num; i > 0; i--) {
                    result.push(parseGeometry())
                }
                break
            }

            default:
                throw new Error(`Unexpected WKBGeometry Type: ${wkbType}`)
        }

        return `${geomConstructors[wkbType]}(${result.join('\n')})`
    }

    return `GeomFromText('${parseGeometry()}')`
}

const stringTypes : (TypecastField['type'])[] = [
    'DATE',
    'DATETIME',
    'STRING',
    'TIME',
    'TIMESTAMP',
    'VAR_STRING',
    'VARCHAR',
    'YEAR',
]

export default function (field : TypecastField) {
    let value : string = ''
    if (field.type === 'GEOMETRY') {
        // parse and convert the binary representation to a nice string
        value = parseGeometryValue(field.buffer())
    } else if (stringTypes.indexOf(field.type) !== -1) {
        // sanitize the string types
        value = sqlstring.escape(field.string())
    } else {
        value = field.string()
    }

    return value
}
