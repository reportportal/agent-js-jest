/* eslint-disable no-undef */
const clientRPRestler = require('reportportal-client-restler');


describe('index script', () => {
    test('require report-portal-restler package', () => {
        const result = new clientRPRestler({
            debug: false,
            token: "00000000-0000-0000-0000-000000000000",
            endpoint: "http://your-instance.com:8080/api/v1",
            launch: "LAUNCH_NAME",
            project: "PROJECT_NAME"
        });

        expect(result).toBeDefined();
        expect(result).not.toBe(null);
    });

    test('require base_reporter from jest-reporters', () => {
        const result = base_reporter = require('jest-reporters/lib/BaseReporter');

        expect(result).toBeDefined();
        expect(result).not.toBe(null);
    });
});
