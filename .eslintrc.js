/** @type {import('@typescript-eslint/experimental-utils').TSESLint.Linter.Config} */
module.exports = {
  extends: ['brad'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    'jest/expect-expect': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.json'],
      },
    },
  },
};
