import * as fs from 'fs'
import { promisify } from 'util'

import * as mysql from 'mysql2/promise'
import testConfig from './testConfig'

const readFile = promisify(fs.readFile)

beforeAll(async () => {
    // setup the database

    const conn = await mysql.createConnection({
        ...testConfig,
        multipleStatements: true,
    })

    const schema = await readFile(`${__dirname}/schema.sql`, 'utf8')
    const data = await readFile(`${__dirname}/data.sql`, 'utf8')

    await conn.query(schema)
    await conn.query(data)

    await conn.end()
})
