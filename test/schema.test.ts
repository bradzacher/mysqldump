import { config } from './testConfig';

import { mysqldump } from './scripts/import';

describe('schema dumps tests', () => {
    function clean(str: string | null): string {
        str = str || '';

        return str
            .split('\n')
            .map(l => l.trimRight())
            .filter(l => l.length > 0)
            .join('\n');
    }
    function testDump(tableName: string, tableDef: string): void {
        tableDef = clean(`
# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: ${tableName}
# ------------------------------------------------------------
${tableDef}`);

        it(tableName, async () => {
            // ACT
            const res = await mysqldump({
                connection: config,
                dump: {
                    tables: [tableName],
                    schema: {
                        autoIncrement: false,
                        engine: false,
                        format: true,
                        table: {
                            dropIfExist: false,
                            ifNotExist: false,
                            charset: false,
                        },
                    },
                    data: false,
                    trigger: false,
                    procedure: false,
                },
            });

            // trim all the lines so whitespace doesn't matter
            const dump = clean(res.dump.schema);

            // ASSERT
            expect(dump).toEqual(tableDef);
        });
    }

    testDump(
        'date_types',
        `
CREATE TABLE \`date_types\` (
  \`dt_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`_date\` date NOT NULL,
  \`_datetime\` datetime NOT NULL,
  \`_time\` time NOT NULL,
  \`_timestamp\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`_year\` year(4) NOT NULL,
  \`_nullDate\` date DEFAULT NULL,
  \`_nullDatetime\` datetime DEFAULT NULL,
  \`_nullTime\` time DEFAULT NULL,
  \`_nullTimestamp\` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  \`_nullYear\` year(4) DEFAULT NULL,
  PRIMARY KEY (\`dt_id\`)
);`,
    );

    testDump(
        'geometry_types',
        `
CREATE TABLE \`geometry_types\` (
  \`gt_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`_point\` point NOT NULL,
  \`_linestring\` linestring NOT NULL,
  \`_polygon\` polygon NOT NULL,
  \`_multipoint\` multipoint NOT NULL,
  \`_multilinestring\` multilinestring NOT NULL,
  \`_multipolygon\` multipolygon NOT NULL,
  \`_geometrycollection\` geometrycollection NOT NULL,
  \`_nullPoint\` point DEFAULT NULL,
  \`_nullLinestring\` linestring DEFAULT NULL,
  \`_nullPolygon\` polygon DEFAULT NULL,
  \`_nullMultipoint\` multipoint DEFAULT NULL,
  \`_nullMultilinestring\` multilinestring DEFAULT NULL,
  \`_nullMultipolygon\` multipolygon DEFAULT NULL,
  \`_nullGeometrycollection\` geometrycollection DEFAULT NULL,
  PRIMARY KEY (\`gt_id\`)
);`,
    );

    testDump(
        'number_types',
        `
CREATE TABLE \`number_types\` (
  \`nt_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`_uint\` int(10) unsigned NOT NULL,
  \`_int\` int(11) NOT NULL,
  \`_tinyint\` tinyint(4) NOT NULL,
  \`_smallint\` smallint(6) NOT NULL,
  \`_mediumint\` mediumint(9) NOT NULL,
  \`_bigint\` bigint(20) NOT NULL,
  \`_decimal\` decimal(6, 2) NOT NULL,
  \`_double\` double NOT NULL,
  \`_float\` float NOT NULL,
  \`_real\` double NOT NULL,
  \`_bit1\` bit(1) NOT NULL,
  \`_bit24\` bit(24) NOT NULL,
  \`_bitWithDefault\` bit(1) NOT NULL DEFAULT b'0',
  \`_bitWithDefault2\` bit(1) NOT NULL DEFAULT b'1',
  \`_nullUint\` int(10) unsigned DEFAULT NULL,
  \`_nullInt\` int(11) DEFAULT NULL,
  \`_nullTinyint\` tinyint(4) DEFAULT NULL,
  \`_nullSmallint\` smallint(6) DEFAULT NULL,
  \`_nullMediumint\` mediumint(9) DEFAULT NULL,
  \`_nullBigint\` bigint(20) DEFAULT NULL,
  \`_nullDecimal\` decimal(6, 2) DEFAULT NULL,
  \`_nullDouble\` double DEFAULT NULL,
  \`_nullFloat\` float DEFAULT NULL,
  \`_nullReal\` double DEFAULT NULL,
  \`_nullBit1\` bit(1) DEFAULT NULL,
  \`_nullBit24\` bit(24) DEFAULT NULL,
  PRIMARY KEY (\`nt_id\`)
);`,
    );

    testDump(
        'other_types',
        `
CREATE TABLE \`other_types\` (
  \`ot_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`_blob\` blob NOT NULL,
  \`_tinyblob\` tinyblob NOT NULL,
  \`_mediumblob\` mediumblob NOT NULL,
  \`_longblob\` longblob NOT NULL,
  \`_binary\` binary(1) NOT NULL,
  \`_varbinary\` varbinary(64) NOT NULL,
  \`_enum\` enum('red', 'green', 'blue') NOT NULL,
  \`_set\` set('a', 'b', 'c') NOT NULL,
  \`_alwaysNull\` int(11) DEFAULT NULL,
  \`populatedViaTrigger\` int(10) unsigned DEFAULT NULL,
  \`populatedViaTrigger2\` int(10) unsigned DEFAULT NULL,
  \`_nullBlob\` blob,
  \`_nullTinyblob\` tinyblob,
  \`_nullMediumblob\` mediumblob,
  \`_nullLongblob\` longblob,
  \`_nullBinary\` binary(1) DEFAULT NULL,
  \`_nullVarbinary\` varbinary(64) DEFAULT NULL,
  \`_nullEnum\` enum('red', 'green', 'blue') DEFAULT NULL,
  \`_nullSet\` set('a', 'b', 'c') DEFAULT NULL,
  PRIMARY KEY (\`ot_id\`)
);`,
    );

    testDump(
        'text_types',
        `
CREATE TABLE \`text_types\` (
  \`ot_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`_char\` char(1) NOT NULL,
  \`_longtext\` longtext NOT NULL,
  \`_text\` text NOT NULL,
  \`_varchar\` varchar(128) NOT NULL,
  \`_nullChar\` char(1) DEFAULT NULL,
  \`_nullLongtext\` longtext,
  \`_nullText\` text,
  \`_nullVarchar\` varchar(128) DEFAULT NULL,
  PRIMARY KEY (\`ot_id\`)
);`,
    );

    testDump(
        'everything',
        `
CREATE OR REPLACE VIEW \`everything\` AS
select
  \`dt\`.\`dt_id\` AS \`dt_id\`,
  \`dt\`.\`_date\` AS \`_date\`,
  \`dt\`.\`_datetime\` AS \`_datetime\`,
  \`dt\`.\`_time\` AS \`_time\`,
  \`dt\`.\`_timestamp\` AS \`_timestamp\`,
  \`dt\`.\`_year\` AS \`_year\`,
  \`dt\`.\`_nullDate\` AS \`_nullDate\`,
  \`dt\`.\`_nullDatetime\` AS \`_nullDatetime\`,
  \`dt\`.\`_nullTime\` AS \`_nullTime\`,
  \`dt\`.\`_nullTimestamp\` AS \`_nullTimestamp\`,
  \`dt\`.\`_nullYear\` AS \`_nullYear\`,
  \`gt\`.\`gt_id\` AS \`gt_id\`,
  \`gt\`.\`_point\` AS \`_point\`,
  \`gt\`.\`_linestring\` AS \`_linestring\`,
  \`gt\`.\`_polygon\` AS \`_polygon\`,
  \`gt\`.\`_multipoint\` AS \`_multipoint\`,
  \`gt\`.\`_multilinestring\` AS \`_multilinestring\`,
  \`gt\`.\`_multipolygon\` AS \`_multipolygon\`,
  \`gt\`.\`_geometrycollection\` AS \`_geometrycollection\`,
  \`gt\`.\`_nullPoint\` AS \`_nullPoint\`,
  \`gt\`.\`_nullLinestring\` AS \`_nullLinestring\`,
  \`gt\`.\`_nullPolygon\` AS \`_nullPolygon\`,
  \`gt\`.\`_nullMultipoint\` AS \`_nullMultipoint\`,
  \`gt\`.\`_nullMultilinestring\` AS \`_nullMultilinestring\`,
  \`gt\`.\`_nullMultipolygon\` AS \`_nullMultipolygon\`,
  \`gt\`.\`_nullGeometrycollection\` AS \`_nullGeometrycollection\`,
  \`nt\`.\`nt_id\` AS \`nt_id\`,
  \`nt\`.\`_uint\` AS \`_uint\`,
  \`nt\`.\`_int\` AS \`_int\`,
  \`nt\`.\`_tinyint\` AS \`_tinyint\`,
  \`nt\`.\`_smallint\` AS \`_smallint\`,
  \`nt\`.\`_mediumint\` AS \`_mediumint\`,
  \`nt\`.\`_bigint\` AS \`_bigint\`,
  \`nt\`.\`_decimal\` AS \`_decimal\`,
  \`nt\`.\`_double\` AS \`_double\`,
  \`nt\`.\`_float\` AS \`_float\`,
  \`nt\`.\`_real\` AS \`_real\`,
  \`nt\`.\`_bit1\` AS \`_bit1\`,
  \`nt\`.\`_bit24\` AS \`_bit24\`,
  \`nt\`.\`_bitWithDefault\` AS \`_bitWithDefault\`,
  \`nt\`.\`_bitWithDefault2\` AS \`_bitWithDefault2\`,
  \`nt\`.\`_nullUint\` AS \`_nullUint\`,
  \`nt\`.\`_nullInt\` AS \`_nullInt\`,
  \`nt\`.\`_nullTinyint\` AS \`_nullTinyint\`,
  \`nt\`.\`_nullSmallint\` AS \`_nullSmallint\`,
  \`nt\`.\`_nullMediumint\` AS \`_nullMediumint\`,
  \`nt\`.\`_nullBigint\` AS \`_nullBigint\`,
  \`nt\`.\`_nullDecimal\` AS \`_nullDecimal\`,
  \`nt\`.\`_nullDouble\` AS \`_nullDouble\`,
  \`nt\`.\`_nullFloat\` AS \`_nullFloat\`,
  \`nt\`.\`_nullReal\` AS \`_nullReal\`,
  \`nt\`.\`_nullBit1\` AS \`_nullBit1\`,
  \`nt\`.\`_nullBit24\` AS \`_nullBit24\`,
  \`ot\`.\`ot_id\` AS \`ot_id\`,
  \`ot\`.\`_blob\` AS \`_blob\`,
  \`ot\`.\`_tinyblob\` AS \`_tinyblob\`,
  \`ot\`.\`_mediumblob\` AS \`_mediumblob\`,
  \`ot\`.\`_longblob\` AS \`_longblob\`,
  \`ot\`.\`_binary\` AS \`_binary\`,
  \`ot\`.\`_varbinary\` AS \`_varbinary\`,
  \`ot\`.\`_enum\` AS \`_enum\`,
  \`ot\`.\`_set\` AS \`_set\`,
  \`ot\`.\`_alwaysNull\` AS \`_alwaysNull\`,
  \`ot\`.\`populatedViaTrigger\` AS \`populatedViaTrigger\`,
  \`ot\`.\`populatedViaTrigger2\` AS \`populatedViaTrigger2\`,
  \`ot\`.\`_nullBlob\` AS \`_nullBlob\`,
  \`ot\`.\`_nullTinyblob\` AS \`_nullTinyblob\`,
  \`ot\`.\`_nullMediumblob\` AS \`_nullMediumblob\`,
  \`ot\`.\`_nullLongblob\` AS \`_nullLongblob\`,
  \`ot\`.\`_nullBinary\` AS \`_nullBinary\`,
  \`ot\`.\`_nullVarbinary\` AS \`_nullVarbinary\`,
  \`ot\`.\`_nullEnum\` AS \`_nullEnum\`,
  \`ot\`.\`_nullSet\` AS \`_nullSet\`
from
  (
  (
    (
    \`date_types\` \`dt\`
    join \`geometry_types\` \`gt\` on((\`dt\`.\`dt_id\` = \`gt\`.\`gt_id\`))
    )
    join \`number_types\` \`nt\` on((\`dt\`.\`dt_id\` = \`nt\`.\`nt_id\`))
  )
  join \`other_types\` \`ot\` on((\`dt\`.\`dt_id\` = \`ot\`.\`ot_id\`))
  );`,
    );
});
