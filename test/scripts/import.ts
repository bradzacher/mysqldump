import mysqldumpFnSig from '../../src/main'

// decide between using the typescript version (for dev testing), or the build version (for prd testing).
const mysqldump : typeof mysqldumpFnSig = process.env.JEST_USE_NPM_BUILD === 'true'
    ? require('../..')
    : require('../../src/main').default

export default mysqldump
