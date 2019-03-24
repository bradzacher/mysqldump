import * as mysql from 'mysql2/promise'

const pool : Array<DB> = []

export class DB {
    private readonly connection : mysql.IPromiseConnection

    // can only instantiate via DB.connect method
    private constructor(connection : mysql.IPromiseConnection) {
        this.connection = connection
    }

    public static async connect(options : mysql.IConnectionConfig) {
        const instance = new DB(await mysql.createConnection(options))
        pool.push(instance)

        return instance
    }

    public async query<T>(sql : string) {
        const res = await this.connection.query<T>(sql)

        return res[0]
    }
    public async multiQuery<T>(sql : string) {
        let isMulti = true
        if (sql.split(';').length === 2) {
            isMulti = false
        }

        let res = (await this.connection.query<Array<T>>(sql))[0]
        if (!isMulti) {
            // mysql will return a non-array payload if there's only one statement in the query
            // so standardise the res..
            res = [res] as any
        }

        return res
    }

    public async end() {
        await this.connection.end().catch(() => {})
    }

    public static async cleanup() {
        await Promise.all(pool.map(async p => {
            await p.end()
        }))
    }
}

export default DB
