const fs = require('fs')

fs.createReadStream(__dirname + '/testConfig.travis.ts')
  .pipe(fs.createWriteStream(__dirname + '/testConfig.ts'))
