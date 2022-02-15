/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/* eslint-disable no-undef */
const { getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject,
    getAgentInfo,
    getCodeRef,
    getFullTestName,
    getSystemAttributes } = require('./../utils/objectUtils');
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

    describe('getStartLaunchObject', function () {
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
    });

    describe('getTestStartObject', function () {
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
    });

    describe('getSuiteStartObject', function () {
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
    });

    describe('getClientInitObject', function () {
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

    describe('getAgentInfo', function() {
        test('should return the name and version of application from package.json file', function () {
            const agentInfo = getAgentInfo();

            expect(agentInfo.name).toBe(pjson.name);
            expect(agentInfo.version).toBe(pjson.version);
        });
    });

    describe('getSystemAttributes', function() {
        test('should return only agent system attribute if parameter is true', function () {
            const expectedSystemAttribute = [{
                key: 'agent',
                value: `${pjson.name}|${pjson.version}`,
                system: true,
            }];

            const systemAttributes = getSystemAttributes(true);

            expect(systemAttributes).toEqual(expectedSystemAttribute);
        });

        test('should return only agent system attribute if there is no parameter', function () {
            const expectedSystemAttribute = [{
                key: 'agent',
                value: `${pjson.name}|${pjson.version}`,
                system: true,
            }];

            const systemAttributes = getSystemAttributes();

            expect(systemAttributes).toEqual(expectedSystemAttribute);
        });

        test('should return agent and skippedIssue system attributes if parameter is false', function () {
            const expectedSystemAttribute = [{
                key: 'agent',
                value: `${pjson.name}|${pjson.version}`,
                system: true,
            }, {
                key: 'skippedIssue',
                value: 'false',
                system: true,
            }];

            const systemAttributes = getSystemAttributes(false);

            expect(systemAttributes).toEqual(expectedSystemAttribute);
        });
    });

    describe('getCodeRef', function() {
        test('should return correct code ref with separator', function() {
            jest.mock('path', () => ({
                sep: '\\',
            }));
            jest.spyOn(process, 'cwd').mockImplementation(() => 'C:\\testProject');
            const mockedTest = {
                title: 'testTitle',
                filePath: `C:\\testProject\\test\\example.js`,
            };
            const expectedCodeRef = 'test/example.js/testTitle';

            const codeRef = getCodeRef(mockedTest.filePath, mockedTest.title);

            expect(codeRef).toEqual(expectedCodeRef);
        });

        test('should return correct code ref without separator', function() {
            jest.mock('path', () => ({
                sep: '\\',
            }));
            jest.spyOn(process, 'cwd').mockImplementation(() => 'C:\\testProject');
            const mockedTest = {
                title: 'testTitle',
                filePath: `C:\\testProject\\example.js`,
            };
            const expectedCodeRef = 'example.js/testTitle';

            const codeRef = getCodeRef(mockedTest.filePath, mockedTest.title);

            expect(codeRef).toEqual(expectedCodeRef);
        });
    });

    describe('getFullTestName', function() {
        test('should return correct full test name', function () {
            const mockedTest = {
                title: 'testTitle',
                ancestorTitles: ['rootDescribe', 'parentDescribe'],
            };
            const expectedFullTestName = 'rootDescribe/parentDescribe/testTitle';

            const fullTestName = getFullTestName(mockedTest);

            expect(fullTestName).toEqual(expectedFullTestName);
        });
    });
});
