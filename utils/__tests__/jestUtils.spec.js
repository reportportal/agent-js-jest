/* eslint-disable no-undef */
const load_base_reporter = require('../jestUtils');


describe('jestUtils', () => {
    test('require base_reporter from jest-reporters', () => {
        const result = load_base_reporter();

        expect(result).toBeDefined();
        expect(result).not.toBe(null);
    });
});
