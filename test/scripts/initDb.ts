import * as fs from 'fs'

import * as mysql from 'mysql2/promise'
import testConfig from '../testConfig'

import schema from '../fixtures/schema'
import triggers from '../fixtures/triggers'

const data = fs.readFileSync(`${__dirname}/../fixtures/data.sql`, 'utf8')

async function initDb() {
    try {
        // setup the database

        const conn = await mysql.createConnection({
            ...testConfig,
            multipleStatements: true,
        })

        await Promise.all(
            Object.keys(schema).map((k : keyof typeof schema) => conn.query(schema[k])),
        )
        await Promise.all(
            triggers.map(t => conn.query(t)),
        )
        await conn.query(data)

        await conn.end()
    } catch (e) {
        console.error(e)

        process.exit(1)
    }
}

initDb()
