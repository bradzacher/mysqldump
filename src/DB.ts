import * as mysql from 'mysql2/promise';

const pool: Array<DB> = [];

class DB {
  private readonly connection: mysql.IPromiseConnection;

  // can only instantiate via DB.connect method
  private constructor(connection: mysql.IPromiseConnection) {
    this.connection = connection;
  }

  public static async connect(options: mysql.IConnectionConfig): Promise<DB> {
    const instance = new DB(await mysql.createConnection(options));
    pool.push(instance);

    return instance;
  }

  public async query<T>(sql: string): Promise<Array<T>> {
    const res = await this.connection.query<T>(sql);

    return res[0];
  }
  public async multiQuery<T>(sql: string): Promise<Array<Array<T>>> {
    let isMulti = true;
    if (sql.split(';').length === 2) {
      isMulti = false;
    }

    let res = (await this.connection.query<Array<T>>(sql))[0];
    if (!isMulti) {
      // @ts-expect-error: mysql will return a non-array payload if there's only one statement in the query so standardize the res..
      res = [res];
    }

    return res;
  }

  public async end(): Promise<void> {
    await this.connection.end().catch(() => {
      // intentionally empty catch as we don't care if an exception occurs when closing the connection
    });
  }

  public static async cleanup(): Promise<void> {
    await Promise.all(
      pool.map(async p => {
        await p.end();
      }),
    );
  }
}

export { DB };
