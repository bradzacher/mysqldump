# Mysql Dump

[![npm version](https://badge.fury.io/js/mysqldump.svg)](https://npmjs.com/package/mysqldump) [![Build Status](https://travis-ci.org/assignar/mysqldump.svg)](https://travis-ci.org/assignar/mysqldump)

Create a backup of a MySQL database.

## Installation

```
yarn add mysqldump
// or
npm install mysqldump
```

## Usage
```typescript
import mysqldump from 'mysqldump'
// or const mysqldump = require('mysqldump')

// dump the result straight to a file
mysqldump({
    connection: {
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'my_database',
    },
    dumpToFile: './dump.sql',
})

// return the dump from the function and not to a file
const result = await mysqldump({
    connection: {
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'my_database',
    },
})
```


## Options
All the below options are documented in the [typescript declaration file](./dist/mysqldump.d.ts):
```TS
export interface ConnectionOptions {
	/**
	 * The database host to connect to.
	 * Defaults to 'localhost'.
	 */
	host?: string;
	/**
	 * The port on the host to connect to.
	 * Defaults to 3306.
	 */
	port?: number;
	/**
	 * The database to dump.
	 */
	database: string;
	/**
	 * The DB username to use to connect.
	 */
	user: string;
	/**
	 * The password to use to connect.
	 */
	password: string;
	/**
	 * The charset to use for the connection.
	 * Defaults to 'UTF8_GENERAL_CI'.
	 */
	charset?: string;
}
export interface SchemaDumpOptions {
	/**
	 * True to include autoincrement values in schema, false otherwise.
	 * Defaults to true.
	 */
	autoIncrement?: boolean;
	/**
	 * True to include engine values in schema, false otherwise.
	 * Defaults to true.
	 */
	engine?: boolean;
	/**
	 * True to run a sql formatter over the output, false otherwise.
	 * Defaults to true.
	 */
	format?: boolean;
	/**
	 * Options for table dumps
	 */
	table?: {
		/**
		 * Guard create table calls with an "IF NOT EXIST"
		 * Defaults to true.
		 */
		ifNotExist?: boolean;
		/**
		 * Drop tables before creation (overrides `ifNotExist`).
		 * Defaults to false.
		 */
		dropIfExist?: boolean;
		/**
		 * Include the `DEFAULT CHARSET = x` at the end of the table definition
		 * Set to true to include the value form the DB.
		 * Set to false to exclude it altogether.
		 * Set to a string to explicitly set the charset.
		 * Defaults to true.
		 */
		charset?: boolean | string;
	};
	view?: {
		/**
		 * Uses `CREATE OR REPLACE` to define views.
		 * Defaults to true.
		 */
		createOrReplace?: boolean;
		/**
		 * Include the `DEFINER = {\`user\`@\`host\` | CURRENT_USER}` in the view definition or not
		 * Defaults to false.
		 */
		definer?: boolean;
		/**
		 * Include the `ALGORITHM = {UNDEFINED | MERGE | TEMPTABLE}` in the view definition or not
		 * Defaults to false.
		 */
		algorithm?: boolean;
		/**
		 * Incldue the `SQL SECURITY {DEFINER | INVOKER}` in the view definition or not
		 * Defaults to false.
		 */
		sqlSecurity?: boolean;
	};
}
export interface TriggerDumpOptions {
	/**
	 * The temporary delimiter to use between statements.
	 * Set to false to not use delmiters
	 * Defaults to ';;'.
	 */
	delimiter?: string | false;
	/**
	 * Drop triggers before creation.
	 * Defaults to false.
	 */
	dropIfExist?: boolean;
	/**
	 * Include the `DEFINER = {\`user\`@\`host\` | CURRENT_USER}` in the view definition or not
	 * Defaults to false.
	 */
	definer?: boolean;
}
export interface DataDumpOptions {
	/**
	 * True to run a sql formatter over the output, false otherwise.
	 * Defaults to true.
	 */
	format?: boolean;
	/**
	 * Dump data from views.
	 * Defaults to false.
	 */
	includeViewData?: boolean;
	/**
	 * Maximum number of rows to include in each multi-line insert statement
	 * Defaults to 1 (i.e. new statement per row).
	 */
	maxRowsPerInsertStatement?: number;
	/**
	 * True to return the data in a function, false to not.
	 * This is useful in databases with a lot of data.
	 *
	 * We stream data from the DB to reduce the memory footprint.
	 * However note that if you want the result returned from the function,
	 * this will result in a larger memory footprint as the string has to be stored in memory.
	 *
	 * Defaults to false if dumpToFile is truthy, or true if not dumpToFile is falsey.
	 */
	returnFromFunction?: boolean;
	/**
	 * A map of tables to additional where strings to add.
	 * Use this to limit the number of data that is dumped.
	 * Defaults to no limits
	 */
	where?: {
		[k: string]: string;
	};
}
export interface DumpOptions {
	/**
	 * The list of tables that you want to dump.
	 * Defaults to all tables (signalled by passing an empty array).
	 */
	tables?: string[];
	/**
	 * True to use the `tables` options as a blacklist, false to use it as a whitelist.
	 * Defaults to false.
	 */
	excludeTables?: boolean;
	/**
	 * Explicitly set to false to not include the schema in the dump.
	 * Defaults to including the schema.
	 */
	schema?: false | SchemaDumpOptions;
	/**
	 * Explicitly set to false to not include data in the dump.
	 * Defaults to including the data.
	 */
	data?: false | DataDumpOptions;
	/**
	 * Explicitly set to false to not include triggers in the dump.
	 * Defaults to including the triggers.
	 */
	trigger?: false | TriggerDumpOptions;
}
export interface Options {
	/**
	 * Database connection options
	 */
	connection: ConnectionOptions;
	/**
	 * Dump configuration options
	 */
	dump?: DumpOptions;
	/**
	 * Set to a path to dump to a file.
	 * Exclude to just return the string.
	 */
	dumpToFile?: string;
}
export interface ColumnList {
	/**
	 * Key is the name of the column
	 */
	[k: string]: {
		/**
		 * The type of the column as reported by the underlying DB.
		 */
		type: string;
		/**
		 * True if the column is nullable, false otherwise.
		 */
		nullable: boolean;
	};
}
export interface Table {
	/**
	 * The name of the table.
	 */
	name: string;
	/**
	 * The raw SQL schema dump for the table.
	 * Null if configured to not dump.
	 */
	schema: string | null;
	/**
	 * The raw SQL data dump for the table.
	 * Null if configured to not dump.
	 */
	data: string | null;
	/**
	 * The list of column definitions for the table.
	 */
	columns: ColumnList;
	/**
	 * An ordered list of columns (for consistently outputing as per the DB definition)
	 */
	columnsOrdered: string[];
	/**
	 * True if the table is actually a view, false otherwise.
	 */
	isView: boolean;
	/**
	 * A list of triggers attached to the table
	 */
	triggers: string[];
}
export interface DumpReturn {
	/**
	 * The result of the dump
	 */
	dump: {
		/**
		 * The concatenated SQL schema dump for the entire database.
		 * Null if configured not to dump.
		 */
		schema: string | null;
		/**
		 * The concatenated SQL data dump for the entire database.
		 * Null if configured not to dump.
		 */
		data: string | null;
		/**
		 * The concatenated SQL trigger dump for the entire database.
		 * Null if configured not to dump.
		 */
		trigger: string | null;
	};
	tables: Table[];
}
export default function main(inputOptions: Options): Promise<DumpReturn>;

export as namespace mysqldump;
```

---------------------------------

The MIT [License](./LICENSE.md)

## Contributing

### Installation

Make sure to first install all the required development dependencies:
```
yarn
// or
npm install .
```

### Linting

We use [eslint](https://www.npmjs.com/package/eslint) in conjunction with [typescript-eslint-parser](https://www.npmjs.com/package/typescript-eslint-parser) for code linting.

PRs are required to pass the linting with no errors and preferrably no warnings.

### Testing

Tests can be run via the `test` script - `yarn test` / `npm test`.

Additionally it's required that you do a build and run your test against the public package to ensure the build doesn't cause regressions - `yarn run test-prod` / `npm run test-prod`.

PRs are required to maintain the 100% test coverage, and all tests must pass successfully.
