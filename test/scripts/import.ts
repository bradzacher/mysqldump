import mysqldumpFnSig from '../../src/main';

// decide between using the typescript version (for dev testing), or the build version (for prd testing).
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- requires are untyped
const mysqldump: typeof mysqldumpFnSig =
  process.env.JEST_USE_NPM_BUILD === 'true'
    ? require('../..')
    : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires -- requires are untyped
      require('../../src/main').default;

export { mysqldump };
