module.exports = {
    moduleFileExtensions: [
        'js',
    ],
    testRegex: '/__tests__/.*\\.spec.(js)$',
    collectCoverageFrom: [
        './utils/**',
        './index.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};