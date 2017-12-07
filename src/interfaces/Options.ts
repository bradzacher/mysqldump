export interface ConnectionOptions {
    /**
     * The database host to connect to.
     * Defaults to 'localhost'.
     */
    host ?: string
    /**
     * The port on the host to connect to.
     * Defaults to 3306.
     */
    port ?: number
    /**
     * The database to dump.
     */
    database : string
    /**
     * The DB username to use to connect.
     */
    user : string
    /**
     * The password to use to connect.
     */
    password : string
}

export interface SchemaDumpOptions {
    /**
     * True to run a sql formatter over the output, false otherwise.
     * Defaults to true.
     */
    format ?: boolean
    /**
     * True to include autoincrement values in schema, false otherwise.
     * Defaults to true.
     */
    autoIncrement ?: boolean
    /**
     * True to include engine values in schema, false otherwise.
     * Defaults to true.
     */
    engine ?: boolean
    /**
     * Guard create table calls with an "IF NOT EXIST"
     * Defaults to true.
     */
    tableIfNotExist ?: boolean
    /**
     * Drop tables before creation (overrides `tableIfNotExist`).
     * Defaults to false.
     */
    tableDropIfExist ?: boolean
    /**
     * Uses `CREATE OR REPLACE` to define views.
     * Defaults to true.
     */
    viewCreateOrReplace ?: boolean
}

export interface DataDumpOptions {
    /**
     * True to run a sql formatter over the output, false otherwise.
     * Defaults to true.
     */
    format ?: boolean
    /**
     * A map of tables to additional where strings to add.
     * Use this to limit the number of data that is dumped.
     * Defaults to no limits
     */
    where ?: {
        [k : string] : string
    }
    /**
     * Dump data from views.
     * Defaults to false.
     */
    includeViewData ?: boolean
}

export interface DumpOptions {
    /**
     * The list of tables that you want to dump.
     * Defaults to all tables (signalled by passing an empty array).
     */
    tables ?: string[]
    /**
     * Explicitly set to false to not include the schema in the dump.
     * Defaults to including the schema.
     */
    schema ?: false | SchemaDumpOptions
    /**
     * Explicitly set to false to not include data in the dump.
     * Defaults to including the data.
     */
    data ?: false | DataDumpOptions
}

export interface Options {
    /**
     * Database connection options
     */
    connection : ConnectionOptions
    /**
     * Dump configuration options
     */
    dump ?: DumpOptions
    /**
     * Set to a path to dump to a file.
     * Exclude to just return the string.
     */
    dumpToFile ?: string
}

export interface CompletedOptions {
    connection : ConnectionOptions
    dump : DumpOptions
    dumpToFile : string | null
}

export default Options
