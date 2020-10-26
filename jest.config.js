const path = require('path');

module.exports = {
    setupFiles: ['./jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx,js}'],
    coverageReporters: ['lcov', 'text', 'json-summary', 'json'],
    testMatch: ['**/?(*.)+(test).{ts,tsx,js}'],
    testURL: 'http://localhost'
}
