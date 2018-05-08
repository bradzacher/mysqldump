import testConfig from '../testConfig'

export default {
    date_types: `
DROP TABLE IF EXISTS \`date_types\`;
CREATE TABLE \`date_types\` (
    \`dt_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    \`_date\` date NOT NULL,
    \`_datetime\` datetime NOT NULL,
    \`_time\` time NOT NULL,
    \`_timestamp\` timestamp NOT NULL,
    \`_year\` year NOT NULL,

    \`_nullDate\` date,
    \`_nullDatetime\` datetime,
    \`_nullTime\` time,
    \`_nullTimestamp\` timestamp,
    \`_nullYear\` year,

    PRIMARY KEY (\`dt_id\`)
);`,

    geometry_types: `
DROP TABLE IF EXISTS \`geometry_types\`;
CREATE TABLE \`geometry_types\` (
    \`gt_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    \`_point\` point NOT NULL,
    \`_linestring\` linestring NOT NULL,
    \`_polygon\` polygon NOT NULL,
    \`_multipoint\` multipoint NOT NULL,
    \`_multilinestring\` multilinestring NOT NULL,
    \`_multipolygon\` multipolygon NOT NULL,
    \`_geometrycollection\` geometrycollection NOT NULL,

    \`_nullPoint\` point,
    \`_nullLinestring\` linestring,
    \`_nullPolygon\` polygon,
    \`_nullMultipoint\` multipoint,
    \`_nullMultilinestring\` multilinestring,
    \`_nullMultipolygon\` multipolygon,
    \`_nullGeometrycollection\` geometrycollection,

    PRIMARY KEY (\`gt_id\`)
);`,

    number_types: `
DROP TABLE IF EXISTS \`number_types\`;
CREATE TABLE \`number_types\` (
    \`nt_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    \`_uint\` int UNSIGNED NOT NULL,
    \`_int\` int NOT NULL,
    \`_tinyint\` tinyint NOT NULL,
    \`_smallint\` smallint NOT NULL,
    \`_mediumint\` mediumint NOT NULL,
    \`_bigint\` bigint NOT NULL,
    \`_decimal\` decimal(6,2) NOT NULL,
    \`_double\` double NOT NULL,
    \`_float\` float NOT NULL,
    \`_real\` real NOT NULL,
    \`_bit1\` bit(1) NOT NULL,
    \`_bit24\` bit(24) NOT NULL,
    \`_bitWithDefault\` bit(1) NOT NULL DEFAULT b'0',
    \`_bitWithDefault2\` bit(1) NOT NULL DEFAULT b'1',

    \`_nullUint\` int UNSIGNED,
    \`_nullInt\` int,
    \`_nullTinyint\` tinyint,
    \`_nullSmallint\` smallint,
    \`_nullMediumint\` mediumint,
    \`_nullBigint\` bigint,
    \`_nullDecimal\` decimal(6,2),
    \`_nullDouble\` double,
    \`_nullFloat\` float,
    \`_nullReal\` real,
    \`_nullBit1\` bit(1),
    \`_nullBit24\` bit(24),

    PRIMARY KEY (\`nt_id\`)
);`,

    text_types: `
DROP TABLE IF EXISTS \`text_types\`;
CREATE TABLE \`text_types\` (
    \`ot_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    \`_char\` char NOT NULL,
    \`_longtext\` longtext NOT NULL,
    \`_text\` text NOT NULL,
    \`_varchar\` varchar(128) NOT NULL,

    \`_nullChar\` char,
    \`_nullLongtext\` longtext,
    \`_nullText\` text,
    \`_nullVarchar\` varchar(128),

    PRIMARY KEY (\`ot_id\`)
);`,

    other_types: `
DROP TABLE IF EXISTS \`other_types\`;
CREATE TABLE \`other_types\` (
    \`ot_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

    \`_blob\` blob NOT NULL,
    \`_tinyblob\` tinyblob NOT NULL,
    \`_mediumblob\` mediumblob NOT NULL,
    \`_longblob\` longblob NOT NULL,
    \`_binary\` binary NOT NULL,
    \`_varbinary\` varbinary(64) NOT NULL,
    \`_enum\` ENUM('red', 'green', 'blue') NOT NULL,
    \`_set\` SET('a', 'b', 'c') NOT NULL,
    \`_alwaysNull\` INT,
    \`populatedViaTrigger\` INT UNSIGNED,
    \`populatedViaTrigger2\` INT UNSIGNED,

    \`_nullBlob\` blob,
    \`_nullTinyblob\` tinyblob,
    \`_nullMediumblob\` mediumblob,
    \`_nullLongblob\` longblob,
    \`_nullBinary\` binary,
    \`_nullVarbinary\` varbinary(64),
    \`_nullEnum\` ENUM('red', 'green', 'blue'),
    \`_nullSet\` SET('a', 'b', 'c'),

    PRIMARY KEY (\`ot_id\`)
);`,

    everything: `
CREATE OR REPLACE DEFINER = \`${testConfig.user}\` @\`${testConfig.host}\` VIEW \`everything\` AS
SELECT *
  FROM date_types AS dt
 INNER JOIN geometry_types AS gt
    ON dt.dt_id = gt.gt_id
 INNER JOIN number_types AS nt
    ON dt.dt_id = nt.nt_id
 INNER JOIN other_types AS ot
    ON dt.dt_id = ot.ot_id;`,

    multiline_insert_test: `
DROP TABLE IF EXISTS \`multiline_insert_test\`;
CREATE TABLE \`multiline_insert_test\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,

  PRIMARY KEY (\`id\`)
);`,
}
