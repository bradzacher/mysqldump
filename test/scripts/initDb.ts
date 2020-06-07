import * as fs from 'fs';

import * as mysql from 'mysql2/promise';
import { config } from '../testConfig';

import { SCHEMA } from '../fixtures/schema';
import { TRIGGERS } from '../fixtures/triggers';

const data = fs.readFileSync(`${__dirname}/../fixtures/data.sql`, 'utf8');

async function initDb(): Promise<void> {
  try {
    // setup the database
    const conn = await mysql.createConnection({
      ...config,
      multipleStatements: true,
    });

    await Promise.all(
      Object.keys(SCHEMA).map(async (k: keyof typeof SCHEMA) =>
        conn.query(SCHEMA[k]),
      ),
    );
    await Promise.all(TRIGGERS.map(async t => conn.query(t)));
    await conn.query(data);

    await conn.end();
  } catch (e) {
    console.error(e);

    process.exit(1);
  }
}

void initDb();
