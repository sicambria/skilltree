module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/__tests__'],
    testMatch: [
        '**/__tests__/**/*.test.js',
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 70,
            functions: 80,
            lines: 80,
        },
    },
    testTimeout: 30000,
    verbose: true,
};
