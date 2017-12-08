(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fs'), require('deepmerge'), require('sql-formatter'), require('mysql2/promise'), require('sqlstring')) :
	typeof define === 'function' && define.amd ? define(['fs', 'deepmerge', 'sql-formatter', 'mysql2/promise', 'sqlstring'], factory) :
	(global.mysqldump = factory(global.fs,global.deepmerge,global.sqlformatter,global.mysql,global.sqlstring));
}(this, (function (fs,deepmerge,sqlformatter,mysql,sqlstring) { 'use strict';

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
}

var getTables = function (connection, dbName, restrictedTables) {
    return __awaiter(this, void 0, void 0, function* () {
        // list the tables
        const showTablesKey = `Tables_in_${dbName}`;
        const tablesRes = (yield connection.query(`SHOW FULL TABLES FROM ${dbName}`));
        const actualTables = tablesRes.map(r => ({
            name: r[showTablesKey].replace(/'/g, ''),
            schema: null,
            data: null,
            isView: r.Table_type === 'VIEW',
            columns: {},
        }));
        let tables = actualTables;
        if (restrictedTables.length > 0) {
            // grab all of the tables from the options that actually exist in the db
            tables = tables.filter(t => restrictedTables.indexOf(t.name) !== -1);
        }
        // get the column definitions
        const columnsMultiQuery = tables.map(t => `SHOW COLUMNS FROM \`${t.name}\` FROM \`${dbName}\`;`).join('\n');
        const columns = (yield connection.multiQuery(columnsMultiQuery));
        columns.forEach((cols, i) => {
            tables[i].columns = cols.reduce((acc, c) => {
                acc[c.Field] = {
                    type: c.Type
                        .split(' ')[0]
                        .split('(')[0]
                        .toLowerCase(),
                    nullable: c.Null === 'YES',
                };
                return acc;
            }, {});
        });
        return tables;
    });
};

function isCreateView(v) {
    return 'View' in v;
}
var getSchemaDump = function (connection, options, tables) {
    return __awaiter(this, void 0, void 0, function* () {
        const format$$1 = options.format ?
            (sql) => sqlformatter.format(sql) :
            (sql) => sql;
        // we create a multi query here so we can query all at once rather than in individual connections
        const getSchemaMultiQuery = tables.map(t => `SHOW CREATE TABLE \`${t.name}\`;`).join('\n');
        const createStatements = (yield connection.multiQuery(getSchemaMultiQuery))
            .map(r => r[0])
            .map((res, i) => {
            const table = tables[i];
            if (isCreateView(res)) {
                return {
                    name: res.View,
                    schema: format$$1(res['Create View']),
                    data: null,
                    isView: true,
                    columns: table.columns,
                };
            }
            return {
                name: res.Table,
                schema: format$$1(res['Create Table']),
                data: null,
                isView: false,
                columns: table.columns,
            };
        })
            .map((s) => {
            // clean up the generated SQL as per the options
            if (!options.autoIncrement) {
                s.schema = s.schema.replace(/AUTO_INCREMENT\s*=\s*\d+ /g, '');
            }
            if (!options.engine) {
                s.schema = s.schema.replace(/ENGINE\s*=\s*\w+ /, '');
            }
            if (s.isView) {
                if (options.viewCreateOrReplace) {
                    s.schema = s.schema.replace(/^CREATE/, 'CREATE OR REPLACE');
                }
            }
            else {
                // eslint-disable-next-line no-lonely-if
                if (options.tableDropIfExist) {
                    s.schema = s.schema.replace(/^CREATE TABLE/, `DROP TABLE IF EXISTS \`${s.name}\`;\nCREATE TABLE`);
                }
                else if (options.tableIfNotExist) {
                    s.schema = s.schema.replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
                }
            }
            // add a semicolon to separate schemas
            s.schema += ';';
            // pad the sql with a header
            s.schema = [
                '# ------------------------------------------------------------',
                `# SCHEMA DUMP FOR TABLE: ${s.name}`,
                '# ------------------------------------------------------------',
                '',
                s.schema,
                '',
                '',
            ].join('\n');
            return s;
        })
            .sort((a, b) => a.name.localeCompare(b.name, 'en-us'));
        return createStatements;
    });
};

const numberTypes = new Set([
    'integer',
    'int',
    'smallint',
    'tinyint',
    'mediumint',
    'bigint',
    'decimal',
    'numeric',
    'float',
    'double',
    'real',
]);
const stringTypes = new Set([
    'date',
    'datetime',
    'timestamp',
    'time',
    'year',
    'timestamp',
    'char',
    'varchar',
    'text',
    'longtext',
    'set',
    'enum',
]);
const bitTypes = new Set([
    'bit',
]);
const hexTypes = new Set([
    'blob',
    'binary',
    'varbinary',
]);
const geometryTypes = new Set([
    'point',
    'linestring',
    'polygon',
    'multipoint',
    'multilinestring',
    'multipolygon',
    'geometrycollection',
]);
function resolveType(columnType) {
    if (numberTypes.has(columnType)) {
        return 'NUMBER';
    }
    if (stringTypes.has(columnType)) {
        return 'STRING';
    }
    if (hexTypes.has(columnType)) {
        return 'HEX';
    }
    if (geometryTypes.has(columnType)) {
        return 'GEOMETRY';
    }
    /* istanbul ignore else */ // shouldn't ever happen
    if (bitTypes.has(columnType)) {
        return 'BIT';
    }
    /* istanbul ignore next */ // shouldn't ever happen
    throw new Error(`UNKNOWN TYPE "${columnType}"`);
}

// adapted from https://github.com/mysqljs/mysql/blob/master/lib/protocol/Parser.js
// changes:
// - cleaned up to use const/let + types
// - reduced duplication
// - made it return a string rather than an object/array
function parseGeometryValue(buffer) {
    let offset = 4;
    const geomConstructors = {
        1: 'POINT',
        2: 'LINESTRING',
        3: 'POLYGON',
        4: 'MULTIPOINT',
        5: 'MULTILINESTRING',
        6: 'MULTIPOLYGON',
        7: 'GEOMETRYCOLLECTION',
    };
    function readDouble(byteOrder) {
        /* istanbul ignore next */ // ignore coverage for this line as it depends on internal db config
        const val = byteOrder ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
        offset += 8;
        return val;
    }
    function readUInt32(byteOrder) {
        /* istanbul ignore next */ // ignore coverage for this line as it depends on internal db config
        const val = byteOrder ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
        offset += 4;
        return val;
    }
    // eslint-disable-next-line complexity
    function parseGeometry() {
        let result = [];
        const byteOrder = buffer.readUInt8(offset);
        offset += 1;
        const wkbType = readUInt32(byteOrder);
        switch (wkbType) {
            case 1: {
                const x = readDouble(byteOrder);
                const y = readDouble(byteOrder);
                result.push(`${x} ${y}`);
                break;
            }
            case 2: {
                const numPoints = readUInt32(byteOrder);
                result = [];
                for (let i = numPoints; i > 0; i--) {
                    const x = readDouble(byteOrder);
                    const y = readDouble(byteOrder);
                    result.push(`${x} ${y}`);
                }
                break;
            }
            case 3: {
                const numRings = readUInt32(byteOrder);
                result = [];
                for (let i = numRings; i > 0; i--) {
                    const numPoints = readUInt32(byteOrder);
                    const line = [];
                    for (let j = numPoints; j > 0; j--) {
                        const x = readDouble(byteOrder);
                        const y = readDouble(byteOrder);
                        line.push(`${x} ${y}`);
                    }
                    result.push(`(${line.join(',')})`);
                }
                break;
            }
            case 4: // WKBMultiPoint
            case 5: // WKBMultiLineString
            case 6: // WKBMultiPolygon
            case 7: {
                const num = readUInt32(byteOrder);
                result = [];
                for (let i = num; i > 0; i--) {
                    let geom = parseGeometry();
                    // remove the function name from the sub geometry declaration from the multi declaration
                    // eslint-disable-next-line default-case
                    switch (wkbType) {
                        case 4:// WKBMultiPoint
                            // multipoint = MULTIPOINT(\d+ \d+, \d+ \d+....)
                            geom = geom.replace(/POINT\((.+)\)/, '$1');
                            break;
                        case 5:// WKBMultiLineString
                            geom = geom.replace('LINESTRING', '');
                            break;
                        case 6:// WKBMultiPolygon
                            geom = geom.replace('POLYGON', '');
                            break;
                    }
                    result.push(geom);
                }
                break;
            }
            /* istanbul ignore next */ // this case shouldn't happen ever
            default:
                throw new Error(`Unexpected WKBGeometry Type: ${wkbType}`);
        }
        return `${geomConstructors[wkbType]}(${result.join(',')})`;
    }
    return `GeomFromText('${parseGeometry()}')`;
}
function intToBit(int) {
    let bits = int.toString(2);
    while (bits.length < 8) {
        bits = `0${bits}`;
    }
    return bits;
}
/**
 * sql-formatter doesn't support hex/binary literals
 * so we wrap them in this fake function call which gets removed later
 */
function noformatWrap(str) {
    return `NOFORMAT_WRAP("##${str}##")`;
}
var typeCast = function (tables) {
    const tablesByName = tables.reduce((acc, t) => {
        acc.set(t.name, t);
        return acc;
    }, new Map());
    // eslint-disable-next-line complexity
    return (field) => {
        const table = tablesByName.get(field.table);
        const columnType = resolveType(table.columns[field.name].type);
        let value = '';
        /* istanbul ignore else */ // the else case shouldn't happen ever
        if (columnType === 'GEOMETRY') {
            // parse and convert the binary representation to a nice string
            value = parseGeometryValue(field.buffer());
        }
        else if (columnType === 'STRING') {
            // sanitize the string types
            value = sqlstring.escape(field.string());
        }
        else if (columnType === 'BIT') {
            // bit fields have a binary representation we have to deal with
            const buf = field.buffer();
            // represent a binary literal (b'010101')
            const numBytes = buf.length;
            let bitString = '';
            for (let i = 0; i < numBytes; i += 1) {
                const int8 = buf.readUInt8(i);
                bitString += intToBit(int8);
            }
            // truncate the bit string to the field length
            bitString = bitString.substr(-field.length);
            value = noformatWrap(`b'${bitString}'`);
        }
        else if (columnType === 'HEX') {
            // binary blobs
            const buf = field.buffer();
            // represent a hex literal (X'AF12')
            const numBytes = buf.length;
            let hexString = '';
            for (let i = 0; i < numBytes; i += 1) {
                const int8 = buf.readUInt8(i);
                hexString += int8.toString(16);
            }
            value = noformatWrap(`X'${hexString}'`);
        }
        else if (columnType === 'NUMBER') {
            value = field.string();
        }
        else {
            throw new Error(`Unknown column type detected: ${columnType}`);
        }
        // handle nulls
        if (value === null) {
            value = 'NULL';
        }
        return value;
    };
};

function buildInsert(result, table, format$$1) {
    const cols = result[1].map(f => f.name);
    const sqlLines = result[0].map((row) => {
        const sql = format$$1([
            `INSERT INTO \`${table.name}\` (\`${cols.join('`,`')}\`)`,
            `VALUES (${cols.map(c => row[c]).join(',')});`,
        ].join(' '));
        // sql-formatter lib doesn't support the X'aaff' or b'01010' literals, and it adds a space in and breaks them
        // this undoes the wrapping we did to get around the formatting
        return sql.replace(/NOFORMAT_WRAP\("##(.+?)##"\)/g, '$1');
    });
    return sqlLines;
}
var getDataDump = function (connectionOptions, options, tables) {
    return __awaiter(this, void 0, void 0, function* () {
        const format$$1 = options.format ?
            (sql) => sqlformatter.format(sql) :
            (sql) => sql;
        // we open a new connection with a special typecast function for dumping data
        const connection = yield mysql.createConnection(deepmerge.all([connectionOptions, {
                multipleStatements: true,
                typeCast: typeCast(tables),
            }]));
        // to avoid having to load an entire DB's worth of data at once, we select from each table individually
        const insertBlocks = yield Promise.all(tables.map((table) => __awaiter(this, void 0, void 0, function* () {
            if (table.isView && !options.includeViewData) {
                // don't dump data for views
                return Promise.resolve(deepmerge.all([table, {
                        data: null,
                    }]));
            }
            const where = options.where[table.name] ? ` WHERE ${options.where[table.name]}` : '';
            const selectAllRes = yield connection.query(`SELECT * FROM \`${table.name}\`${where}`);
            const inserts = buildInsert(selectAllRes, table, format$$1);
            return deepmerge.all([table, {
                    data: [
                        '# ------------------------------------------------------------',
                        `# DATA DUMP FOR TABLE: ${table.name}`,
                        '# ------------------------------------------------------------',
                        '',
                        inserts.join('\n'),
                        '',
                        '',
                    ].join('\n'),
                }]);
        })));
        yield connection.end();
        return insertBlocks;
    });
};

const pool = [];
class DB {
    // can only instantiate via DB.connect method
    // eslint-disable-next-line no-useless-constructor, no-empty-function
    constructor(connection) {
        this.connection = connection;
    }
    static connect(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new DB(yield mysql.createConnection(options));
            pool.push(instance);
            return instance;
        });
    }
    query(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.connection.query(sql);
            return res[0];
        });
    }
    multiQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let isMulti = true;
            if (sql.split(';').length === 2) {
                isMulti = false;
            }
            let res = (yield this.connection.query(sql))[0];
            if (!isMulti) {
                // mysql will return a non-array payload if there's only one statement in the query
                // so standardise the res..
                res = [res];
            }
            return res;
        });
    }
    end() {
        return this.connection.end().catch(() => { });
    }
    static cleanup() {
        return Promise.all(pool.map(p => p.end()));
    }
}

const defaultOptions = {
    connection: {
        host: 'localhost',
        port: 3306,
        user: '',
        password: '',
        database: '',
    },
    dump: {
        tables: [],
        schema: {
            format: true,
            autoIncrement: true,
            engine: true,
            tableIfNotExist: true,
            tableDropIfExist: false,
            viewCreateOrReplace: true,
        },
        data: {
            format: true,
            includeViewData: false,
            where: {},
        },
    },
    dumpToFile: null,
};
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function main(inputOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            // assert the given options have all the required properties
            assert(inputOptions.connection, 'Expected to be given `connection` options.');
            assert(inputOptions.connection.host, 'Expected to be given `host` connection option.');
            assert(inputOptions.connection.user, 'Expected to be given `user` connection option.');
            // note that you can have empty string passwords, hence the type assertion
            assert(typeof inputOptions.connection.password === 'string', 'Expected to be given `password` connection option.');
            const options = deepmerge.all([defaultOptions, inputOptions]);
            // make sure the port is a number
            options.connection.port = parseInt(options.connection.port, 10);
            connection = yield DB.connect(deepmerge.all([options.connection, { multipleStatements: true }]));
            // list the tables
            const res = {
                dump: {
                    schema: '',
                    data: '',
                },
                tables: (yield getTables(connection, options.connection.database, options.dump.tables)),
            };
            // dump the schema if requested
            if (options.dump.schema !== false) {
                res.tables = yield getSchemaDump(connection, options.dump.schema, res.tables);
                res.dump.schema = res.tables.map(t => t.schema).filter(t => t).join('\n');
            }
            yield connection.end();
            // dump data if requested
            if (options.dump.data !== false) {
                res.tables = yield getDataDump(options.connection, options.dump.data, res.tables);
                res.dump.data = res.tables.map(t => t.data).filter(t => t).join('\n');
            }
            if (options.dumpToFile) {
                const clob = [
                    res.dump.schema || '',
                    res.dump.data || '',
                    '',
                ].join('\n');
                fs.writeFileSync(options.dumpToFile, clob);
            }
            return res;
        }
        finally {
            DB.cleanup();
        }
    });
}

return main;

})));
