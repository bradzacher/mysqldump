import * as mysql from 'mysql2/promise'

const pool : DB[] = []

export class DB {
    private readonly connection : mysql.IPromiseConnection

    // can only instantiate via DB.connect method
    // eslint-disable-next-line no-useless-constructor, no-empty-function
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
        const res = await this.connection.query<T[]>(sql)

        return res[0].map((r) => {
            // if for some reason, the multi-query only has one statement,
            // mysql will return it as a single element rather than an array
            if (!Array.isArray(r)) {
                return [r]
            }

            return r
        })
    }

    public end() {
        return this.connection.end().catch(() => {})
    }

    public static cleanup() {
        return Promise.all(pool.map(p => p.end()))
    }
}

export default DB
