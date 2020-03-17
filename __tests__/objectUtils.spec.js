/* eslint-disable no-undef */
const { getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject } = require('./../utils/objectUtils');
const pjson = require('./../package.json');
const defaultOptions = {
    launch: 'launchName',
    description: 'description',
    attributes: [
        {
            'key': 'YourKey',
            'value': 'YourValue'
        }, {
            'value': 'YourValue'
        }
    ],
    rerun: true,
    rerunOf: '00000000-0000-0000-0000-000000000000',
};
const currentDate = new Date();
const RealDate = Date;

describe('Object Utils script', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        global.Date = jest.fn(
            (...args) =>
                args.length
                    ? new RealDate(...args)
                    : new RealDate(currentDate)
        );
        Object.assign(Date, RealDate);

        jest.resetModules();
        process.env = { ...OLD_ENV };
        delete process.env.NODE_ENV;
    });

    afterEach(() => {
        jest.clearAllMocks();
        global.Date = RealDate;
        process.env = OLD_ENV;
    });

    test('should return start launch object with correct values', () => {
        const expectedStartLaunchObject = {
            launch: 'launchName',
            description: 'description',
            attributes: [
                {
                    'key': 'YourKey',
                    'value': 'YourValue'
                }, {
                    'value': 'YourValue'
                }, {
                    key: 'agent',
                    value: `${pjson.name}|${pjson.version}`,
                    system: true,
                },
            ],
            rerun: true,
            rerunOf: '00000000-0000-0000-0000-000000000000',
            startTime: new Date().valueOf(),
        };

        const startLaunchObject = getStartLaunchObject(defaultOptions);

        expect(startLaunchObject).toBeDefined();
        expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });

    test('should return start launch object with default values if options don\'t set', () => {
        const expectedStartLaunchObject = {
            launch: 'Unit Tests',
            attributes: [
                {
                    key: 'agent',
                    value: `${pjson.name}|${pjson.version}`,
                    system: true,
                }
            ],
            startTime: new Date().valueOf(),
        };

        const startLaunchObject = getStartLaunchObject();

        expect(startLaunchObject).toBeDefined();
        expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });

    test('should return test start object with correct values', () => {
        const expectedTestStartObject = {
            type: 'STEP',
            name: 'test title',
            retry: true
        };

        const testStartObject = getTestStartObject('test title', true);

        expect(testStartObject).toBeDefined();
        expect(testStartObject).toEqual(expectedTestStartObject);
    });

    test('should return suite start object with correct values', () => {
        const expectedSuiteStartObject = {
            type: 'SUITE',
            name: 'suite name',
            startTime: new Date().valueOf(),
        };

        const suiteStartObject = getSuiteStartObject('suite name');

        expect(suiteStartObject).toBeDefined();
        expect(suiteStartObject).toEqual(expectedSuiteStartObject);
    });

    test('should return client init object with correct values, some parameters taken from environment variables', () => {
        process.env = {
            RP_TOKEN: '00000000-0000-0000-0000-000000000000',
            RP_LAUNCH: 'launch name',
            RP_PROJECT_NAME: 'project name',
            RP_ATTRIBUTES: 'attributesOne,attributesTwoKey:attributesTwoValue',

        };
        const expectedClientInitObject = {
            token: '00000000-0000-0000-0000-000000000000',
            endpoint: 'endpoint',
            launch: 'launch name',
            project: 'project name',
            rerun: true,
            rerunOf: '00000000-0000-0000-0000-000000000000',
            description: 'description',
            attributes: [{ key: null, value: 'attributesOne' }, { key: 'attributesTwoKey', value: 'attributesTwoValue' }]
        };
        const options = {
            endpoint: 'endpoint',
            rerun: true,
            rerunOf: '00000000-0000-0000-0000-000000000000',
            description: 'description'
        };

        const clientInitObject = getClientInitObject(options);

        expect(clientInitObject).toBeDefined();
        expect(clientInitObject).toEqual(expectedClientInitObject);
    });

    test('should return client init object with default values if options don\'t set', () => {
        const expectedClientInitObject = {
            launch: 'Unit Tests',
        };

        const clientInitObject = getClientInitObject();

        expect(clientInitObject).toBeDefined();
        expect(clientInitObject).toEqual(expectedClientInitObject);
    });
});
