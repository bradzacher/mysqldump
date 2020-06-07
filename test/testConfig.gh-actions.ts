import { ConnectionOptions } from '../src/interfaces/Options';

const config: ConnectionOptions = {
  host: '127.0.0.1',
  // GH actions assigns a random port that we have to use
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  user: 'root',
  password: '',
  database: 'mysqldump_test',
};

export { config };
