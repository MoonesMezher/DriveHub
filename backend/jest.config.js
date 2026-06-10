/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/scripts/**',
    ],
    coverageDirectory: 'coverage',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true,
};
