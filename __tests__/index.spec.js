/* eslint-disable no-undef */
const clientRP = require('reportportal-client');


describe('index script', () => {
    test('require reportportal-client package', () => {
        const result = new clientRP({
            debug: false,
            token: "00000000-0000-0000-0000-000000000000",
            endpoint: "http://your-instance.com:8080/api/v1",
            launch: "LAUNCH_NAME",
            project: "PROJECT_NAME"
        });

        expect(result).toBeDefined();
        expect(result).not.toBe(null);
    });
});
