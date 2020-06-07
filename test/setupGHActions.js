// eslint-disable-next-line @typescript-eslint/no-var-requires -- js file
const fs = require('fs');

fs.createReadStream(`${__dirname}/testConfig.gh-actions.ts`).pipe(
  fs.createWriteStream(`${__dirname}/testConfig.ts`),
);
