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
const path = require('path');
const { getOptions, RPClient } = require('./mocks/reportportal-client.mock');
const JestReportPortal = require('../index');
const pjson = require('./../package.json');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const GLOBAL_CONFIG = {};
const options = getOptions();
const currentDate = new Date();
const RealDate = Date;
const systemAttr = {
    key: 'agent',
    value: `${pjson.name}|${pjson.version}`,
    system: true,
};
const testResult = {
    testResults: [
        {
            title: 'Title',
            status: 'failed',
            ancestorTitles: ['Suite name'],
            failureMessages: 'error message',
            invocations: 1,
        },
    ],
};
const testObj = {
    path: `C:${path.sep}testProject${path.sep}example.js`,
};

describe('index script', () => {
    let reporter;

    beforeAll(() => {
        reporter = new JestReportPortal(GLOBAL_CONFIG, options);
        reporter.client = new RPClient();
    });

    beforeEach(() => {
        global.Date = jest.fn(
            (...args) =>
                (args.length
                    ? new RealDate(...args)
                    : new RealDate(currentDate)),
        );
        Object.assign(Date, RealDate);
    });

    afterEach(() => {
        jest.clearAllMocks();
        reporter.tempLaunchId = '';
        reporter.tempSuiteId = '';
        reporter.tempTestId = '';
        global.Date = RealDate;
    });

    afterAll(() => {
        reporter = null;
    });

    describe('constructor', () => {
        test('client and options should be defined', () => {
            expect(reporter.reportOptions).toBeDefined();
            expect(reporter.client).toBeDefined();
        });
    });

    describe('onRunStart', () => {
        test('startLaunch should be called with parameters', () => {
            reporter.onRunStart();

            expect(reporter.tempLaunchId).toEqual('startLaunch');
            expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);

            const launchObj = {
                launch: options.launch,
                description: options.description,
                attributes: [...options.attributes, systemAttr],
                rerun: undefined,
                rerunOf: undefined,
                startTime: new Date().valueOf(),
            };

            expect(reporter.client.startLaunch).toHaveBeenCalledWith(launchObj);
        });
    });

    describe('onTestResult', () => {
        test('startSuite, startTest, finishTest, finishSuite should be called with parameters', () => {
            const spyStartSuite = jest.spyOn(reporter, '_startSuite');
            const spyStartTest = jest.spyOn(reporter, '_startTest');
            const spyFinishTest = jest.spyOn(reporter, '_finishTest');
            const spyFinishSuite = jest.spyOn(reporter, '_finishSuite');

            reporter.onTestResult(testObj, testResult);

            expect(spyStartSuite).toHaveBeenCalledWith(testResult.testResults[0].ancestorTitles[0], testObj.path);
            expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
            expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], false);
            expect(spyFinishSuite).toHaveBeenCalled();
        });

        test('startTest, finishTest should be called one times with second parameter \'false\' if there'
            + ' are no retries', () => {
            const spyStartTest = jest.spyOn(reporter, '_startTest');
            const spyFinishTest = jest.spyOn(reporter, '_finishTest');

            reporter.onTestResult(testObj, testResult);

            expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
            expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], false);
            expect(spyStartTest).toHaveBeenCalledTimes(1);
            expect(spyFinishTest).toHaveBeenCalledTimes(1);
        });

        test('startTest, finishTest should be called two times with second parameter \'true\' if there'
            + ' are retries', () => {
            const spyStartTest = jest.spyOn(reporter, '_startTest');
            const spyFinishTest = jest.spyOn(reporter, '_finishTest');
            const testResult = {
                testResults: [
                    {
                        title: 'Title',
                        status: 'failed',
                        ancestorTitles: ['Suite name'],
                        failureMessages: 'error message',
                        invocations: 2,
                    },
                ],
            };

            reporter.onTestResult(testObj, testResult);

            expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0], true, testObj.path);
            expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], true);
            expect(spyStartTest).toHaveBeenCalledTimes(2);
            expect(spyFinishTest).toHaveBeenCalledTimes(2);
        });

        test('startTest, finishTest should be called ones with second parameter \'false\' if there is'
            + ' no invocations', () => {
            const spyStartTest = jest.spyOn(reporter, '_startTest');
            const spyFinishTest = jest.spyOn(reporter, '_finishTest');
            const testResult = {
                testResults: [
                    {
                        title: 'Title',
                        status: 'failed',
                        ancestorTitles: ['Suite name'],
                        failureMessages: 'error message',
                    },
                ],
            };

            reporter.onTestResult(testObj, testResult);

            expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
            expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], false);
        });
    });

    describe('onRunComplete', () => {
        test('finishLaunch should be called with tempLaunchId', () => {
            reporter.tempLaunchId = 'tempLaunchId';

            reporter.onRunComplete();

            expect(reporter.client.finishLaunch).toHaveBeenCalledWith('tempLaunchId');
        });
    });

    describe('_startSuite', () => {
        test('startTestItem should be called with parameters, tempSuiteId should be defined', () => {
            jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
            const expectedStartTestItemParameter = {
                type: 'SUITE',
                name: 'suite name',
                codeRef: 'example.js/suite name',
                startTime: new Date().valueOf(),
            };
            reporter.tempLaunchId = 'tempLaunchId';

            reporter._startSuite('suite name', testObj.path);

            expect(reporter.client.startTestItem).toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId');
            expect(reporter.tempSuiteId).toEqual('startTestItem');
        });
    });

    describe('_startTest', () => {
        test('startTestItem should be called with parameters, tempTestId should be defined', () => {
            jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
            const expectedStartTestItemParameter = {
                type: 'STEP',
                name: 'test name',
                codeRef: 'example.js/rootDescribe/test name',
                retry: true,
            };
            reporter.tempLaunchId = 'tempLaunchId';
            reporter.tempSuiteId = 'tempSuiteId';

            reporter._startTest({ title: 'test name', ancestorTitles: ['rootDescribe'] }, true, testObj.path);

            expect(reporter.client.startTestItem)
                .toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId', 'tempSuiteId');
            expect(reporter.tempTestId).toEqual('startTestItem');
        });
    });

    describe('_sendLog', () => {
        test('sendLog should be called with parameters', () => {
            const expectedLogObjectParameter = {
                message: 'message',
                level: 'error',
            };
            reporter.tempTestId = 'tempTestId';

            reporter._sendLog('message');

            expect(reporter.client.sendLog).toHaveBeenCalledWith('tempTestId', expectedLogObjectParameter);
        });
    });

    describe('_finishTest', () => {
        test('_finishPassedTest should be called if test status is passed', () => {
            const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
            const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
            const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

            reporter._finishTest({ status: testItemStatuses.PASSED, failureMessages: [] });

            expect(spyFinishPassedTest).toHaveBeenCalled();
            expect(spyFinishFailedTest).not.toHaveBeenCalled();
            expect(spyFinishSkippedTest).not.toHaveBeenCalled();
        });

        test('_finishFailedTest should be called with error message if test status is failed', () => {
            const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
            const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
            const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

            reporter._finishTest(
                { status: testItemStatuses.FAILED, failureMessages: ['error message'] },
                false,
            );

            expect(spyFinishFailedTest).toHaveBeenCalledWith('error message', false);
            expect(spyFinishPassedTest).not.toHaveBeenCalled();
            expect(spyFinishSkippedTest).not.toHaveBeenCalled();
        });

        test('_finishSkippedTest should be called if test status is skipped or any other', () => {
            const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
            const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
            const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

            reporter._finishTest({ status: testItemStatuses.SKIPPED, failureMessages: [] });

            expect(spyFinishSkippedTest).toHaveBeenCalled();
            expect(spyFinishPassedTest).not.toHaveBeenCalled();
            expect(spyFinishFailedTest).not.toHaveBeenCalled();
        });
    });

    describe('_finishSuite', () => {
        test('finishTestItem should be called with parameters', () => {
            reporter.tempSuiteId = 'tempSuiteId';

            reporter._finishSuite();

            expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempSuiteId', {});
        });
    });

    describe('_finishPassedTest', () => {
        test('finishTestItem should be called with parameters', () => {
            const expectedFinishTestItemParameter = {
                status: 'passed',
                retry: false,
            };
            reporter.tempTestId = 'tempTestId';

            reporter._finishPassedTest(false);

            expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
        });
    });

    describe('_finishFailedTest', () => {
        test('_sendLog should be called with failure message, finishTestItem should be called with parameters', () => {
            const spySendLog = jest.spyOn(reporter, '_sendLog');
            const expectedFinishTestItemParameter = {
                status: 'failed',
                retry: false,
            };
            reporter.tempTestId = 'tempTestId';

            reporter._finishFailedTest('error message', false);

            expect(spySendLog).toHaveBeenCalledWith('error message');
            expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
        });
    });

    describe('_finishSkippedTest', () => {
        test('finishTestItem should be called with parameters', () => {
            const expectedFinishTestItemParameter = {
                status: 'skipped',
                retry: false,
            };
            reporter.tempTestId = 'tempTestId';

            reporter._finishSkippedTest(false);

            expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
        });

        test('finishTestItem should be called with issue parameter if skippedIssue is false', () => {
            const expectedFinishTestItemParameter = {
                status: 'skipped',
                retry: false,
                issue: { issueType: 'NOT_ISSUE' },
            };
            reporter.tempTestId = 'tempTestId';
            reporter.reportOptions.skippedIssue = false;

            reporter._finishSkippedTest(false);

            expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
        });
    });
});
