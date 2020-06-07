import * as sqlformatter from 'sql-formatter';

import { SchemaDumpOptions } from './interfaces/Options';
import { Table } from './interfaces/Table';
import { DB } from './DB';

/* eslint-disable @typescript-eslint/naming-convention -- types from the underlying mysql query */
type ShowCreateView = {
  View: string;
  'Create View': string;
  character_set_client: string;
  collation_connection: string;
};
type ShowCreateTable = {
  Table: string;
  'Create Table': string;
};
type ShowCreateTableStatementRes = ShowCreateView | ShowCreateTable;
/* eslint-enable @typescript-eslint/naming-convention -- types from the underlying mysql query */

function isCreateView(v: ShowCreateTableStatementRes): v is ShowCreateView {
  return 'View' in v;
}

async function getSchemaDump(
  connection: DB,
  options: Required<SchemaDumpOptions>,
  tables: Array<Table>,
): Promise<Array<Table>> {
  const format = options.format
    ? (sql: string) => sqlformatter.format(sql)
    : (sql: string) => sql;

  // we create a multi query here so we can query all at once rather than in individual connections
  const getSchemaMultiQuery = tables
    .map(t => `SHOW CREATE TABLE \`${t.name}\`;`)
    .join('\n');
  const createStatements = (
    await connection.multiQuery<ShowCreateTableStatementRes>(
      getSchemaMultiQuery,
    )
  )
    // mysql2 returns an array of arrays which will all have our one row
    .map(r => r[0])
    .map((res, i) => {
      const table = tables[i];
      if (isCreateView(res)) {
        return {
          ...table,
          name: res.View,
          schema: format(res['Create View']),
          data: null,
          isView: true,
        };
      }

      return {
        ...table,
        name: res.Table,
        schema: format(res['Create Table']),
        data: null,
        isView: false,
      };
    })
    .map(s => {
      // clean up the generated SQL as per the options

      if (!options.autoIncrement) {
        s.schema = s.schema.replace(/AUTO_INCREMENT\s*=\s*\d+ /g, '');
      }
      if (!options.engine) {
        s.schema = s.schema.replace(/ENGINE\s*=\s*\w+ /, '');
      }
      if (s.isView) {
        if (options.view.createOrReplace === true) {
          s.schema = s.schema.replace(/^CREATE/, 'CREATE OR REPLACE');
        }
        if (options.view.algorithm !== true) {
          s.schema = s.schema.replace(
            /^CREATE( OR REPLACE)? ALGORITHM[ ]?=[ ]?\w+/,
            'CREATE$1',
          );
        }
        if (options.view.definer !== true) {
          s.schema = s.schema.replace(
            /^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)? DEFINER[ ]?=[ ]?.+?@.+?( )/,
            'CREATE$1$2$3',
          );
        }
        if (options.view.sqlSecurity !== true) {
          s.schema = s.schema.replace(
            /^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)?( DEFINER[ ]?=[ ]?.+?@.+)? SQL SECURITY (?:DEFINER|INVOKER)/,
            'CREATE$1$2$3',
          );
        }
      } else {
        if (options.table.dropIfExist === true) {
          s.schema = s.schema.replace(
            /^CREATE TABLE/,
            `DROP TABLE IF EXISTS \`${s.name}\`;\nCREATE TABLE`,
          );
        } else if (options.table.ifNotExist === true) {
          s.schema = s.schema.replace(
            /^CREATE TABLE/,
            'CREATE TABLE IF NOT EXISTS',
          );
        }
        if (options.table.charset === false) {
          s.schema = s.schema.replace(
            /( )?(DEFAULT )?(CHARSET|CHARACTER SET) = \w+/,
            '',
          );
        }
      }

      // fix up binary/hex default values if formatted
      if (options.format) {
        s.schema = s.schema
          // fix up binary and hex strings
          .replace(/DEFAULT b '(\d+)'/g, "DEFAULT b'$1'")
          .replace(/DEFAULT X '(\d+)'/g, "DEFAULT X'$1'")
          // fix up set defs which get split over two lines and then cause next lines to be extra indented
          .replace(/\n {2}set/g, ' set')
          .replace(/ {4}/g, '  ');
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
      ].join('\n');

      return s;
    })
    .sort((a, b) => {
      // sort the views to be last

      if (a.isView && !b.isView) {
        return 1;
      }
      if (!a.isView && b.isView) {
        return -1;
      }

      return 0;
    });

  return createStatements;
}

export {
  ShowCreateView,
  ShowCreateTable,
  ShowCreateTableStatementRes,
  getSchemaDump,
};
