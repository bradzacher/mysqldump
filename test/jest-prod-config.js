const baseConfig = require('../jest.json');

// disable coverage in prod mode
// we only care for coverage on source code, not build code
module.exports = Object.assign({}, baseConfig, {
    coverageThreshold: {},
    collectCoverage: false,
    rootDir: '../',
});
