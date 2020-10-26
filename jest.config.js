const path = require('path');

module.exports = {
    setupFiles: ['./jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.js'],
    coverageReporters: ['lcov', 'text', 'json-summary', 'json'],
    testMatch: ['**/?(*.)+(test).js'],
    testURL: 'http://localhost'
}
