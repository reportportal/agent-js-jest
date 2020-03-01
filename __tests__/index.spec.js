/* eslint-disable no-undef */
const { getOptions, RPClient } = require('./mocks/reportportal-client.mock');
const JestReportPortal = require('../index');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const GLOBAL_CONFIG = {};
const options = getOptions();
const currentDate = new Date();
const RealDate = Date;
const testResult = {
    testResults: [
        {
            title: 'Title',
            status: 'failed',
            ancestorTitles: ['Suite name'],
            failureMessages: 'error message',
            invocations: 1,
        }
    ]
};

describe('index script', () => {
    let reporter;

    beforeAll(() => {
        reporter = new JestReportPortal(GLOBAL_CONFIG, options);
        reporter.client = new RPClient();
    });

    beforeEach(() => {
        global.Date = jest.fn(
            (...props) =>
                props.length
                    ? new RealDate(...props)
                    : new RealDate(currentDate)
        );
        Object.assign(Date, RealDate);
    });

    afterEach(() => {
        jest.clearAllMocks();
        global.Date = RealDate;
    });

    afterAll(() => {
        reporter = null;
    });

    test('constructor: client and options should be defined', () => {
        expect(reporter.reportOptions).toBeDefined();
        expect(reporter.client).toBeDefined();
    });

    test('onRunStart: startLaunch should be called with parameters', () => {
        reporter.onRunStart();

        expect(reporter.tempLaunchId).toEqual('startLaunch');
        expect(reporter.client.startLaunch).toHaveBeenCalledTimes(1);

        const launchObj = {
            launch: options.launch,
            description: options.description,
            attributes: options.attributes,
            rerun: undefined,
            rerunOf: undefined,
            startTime: new Date().valueOf()
        };

        expect(reporter.client.startLaunch).toHaveBeenCalledWith(launchObj);
    });

    test('onTestResult: startSuite, startTest, finishTest, finishSuite should be called with parameters', () => {
        const spyStartSuite = jest.spyOn(reporter, '_startSuite');
        const spyStartTest = jest.spyOn(reporter, '_startTest');
        const spyFinishTest = jest.spyOn(reporter, '_finishTest');
        const spyFinishSuite = jest.spyOn(reporter, '_finishSuite');

        reporter.onTestResult({}, testResult);

        expect(spyStartSuite).toHaveBeenCalledWith(testResult.testResults[0].ancestorTitles[0]);
        expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0].title, false);
        expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], false);
        expect(spyFinishSuite).toHaveBeenCalled();
    });

    test('onTestResult: startTest, finishTest should be called one times with second parameter \'false\' if there are no retries', () => {
        const spyStartTest = jest.spyOn(reporter, '_startTest');
        const spyFinishTest = jest.spyOn(reporter, '_finishTest');

        reporter.onTestResult({}, testResult);

        expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0].title, false);
        expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], false);
        expect(spyStartTest).toHaveBeenCalledTimes(1);
        expect(spyFinishTest).toHaveBeenCalledTimes(1);
    });

    test('onTestResult: startTest, finishTest should be called two times with second parameter \'true\' if there are retries', () => {
        const spyStartTest = jest.spyOn(reporter, '_startTest');
        const spyFinishTest = jest.spyOn(reporter, '_finishTest');
        testResult.testResults[0].invocations = 2;

        reporter.onTestResult({}, testResult);

        expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0].title, true);
        expect(spyFinishTest).toHaveBeenCalledWith(testResult.testResults[0], true);
        expect(spyStartTest).toHaveBeenCalledTimes(2);
        expect(spyFinishTest).toHaveBeenCalledTimes(2);
    });

    test('onRunComplete: finishLaunch should be called with tempLaunchId', () => {
        reporter.tempLaunchId = 'tempLaunchId';

        reporter.onRunComplete();

        expect(reporter.client.finishLaunch).toHaveBeenCalledWith('tempLaunchId');
    });

    test('_startSuite: startTestItem should be called with parameters, tempSuiteId should be defined', () => {
        const expectedStartTestItemParameter = {
            type: 'SUITE',
            name: 'suite name',
            startTime: new Date().valueOf()
        };
        reporter.tempLaunchId = 'tempLaunchId';

        reporter._startSuite('suite name');

        expect(reporter.client.startTestItem).toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId');
        expect(reporter.tempSuiteId).toEqual('startTestItem');
    });

    test('_startTest: startTestItem should be called with parameters, tempTestId should be defined', () => {
        const expectedStartTestItemParameter = {
            type: 'STEP',
            name: 'test name',
            retry: true,
        };
        reporter.tempLaunchId = 'tempLaunchId';
        reporter.tempSuiteId = 'tempSuiteId';

        reporter._startTest('test name', true);

        expect(reporter.client.startTestItem).toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId', 'tempSuiteId');
        expect(reporter.tempTestId).toEqual('startTestItem');
    });

    test('_sendLog: sendLog should be called with parameters', () => {
        const expectedLogObjectParameter = {
            message: 'message',
            level: 'error',
        };
        reporter.tempTestId = 'tempTestId';

        reporter._sendLog('message');

        expect(reporter.client.sendLog).toHaveBeenCalledWith('tempTestId', expectedLogObjectParameter);
    });

    test('_finishTest: _finishPassedTest should be called if test status is passed', () => {
        const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
        const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
        const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

        reporter._finishTest({ status: testItemStatuses.PASSED, failureMessages: [] });

        expect(spyFinishPassedTest).toHaveBeenCalled();
        expect(spyFinishFailedTest).not.toHaveBeenCalled();
        expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishTest: _finishFailedTest should be called with error message if test status is failed', () => {
        const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
        const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
        const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

        reporter._finishTest({ status: testItemStatuses.FAILED, failureMessages: ['error message'] }, false);

        expect(spyFinishFailedTest).toHaveBeenCalledWith('error message', false);
        expect(spyFinishPassedTest).not.toHaveBeenCalled();
        expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishTest: _finishSkippedTest should be called if test status is skipped', () => {
        const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
        const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
        const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

        reporter._finishTest({ status: testItemStatuses.SKIPPED, failureMessages: [] });

        expect(spyFinishSkippedTest).toHaveBeenCalled();
        expect(spyFinishPassedTest).not.toHaveBeenCalled();
        expect(spyFinishFailedTest).not.toHaveBeenCalled();
    });

    test('_finishTest: _finishPassedTest, _finishFailedTest, _finishSkippedTest should not be called if test status doesn\'t exist', () => {
        const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedTest');
        const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedTest');
        const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedTest');

        reporter._finishTest({ status: 'random', failureMessages: [] });

        expect(spyFinishSkippedTest).not.toHaveBeenCalled();
        expect(spyFinishPassedTest).not.toHaveBeenCalled();
        expect(spyFinishFailedTest).not.toHaveBeenCalled();
    });

    test('_finishSuite: finishTestItem should be called with parameters', () => {
        reporter.tempSuiteId = 'tempSuiteId';

        reporter._finishSuite();

        expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempSuiteId', {});
    });

    test('_finishPassedTest: finishTestItem should be called with parameters', () => {
        const expectedFinishTestItemParameter = {
            status: 'passed',
            retry: false,
        };
        reporter.tempTestId = 'tempTestId';

        reporter._finishPassedTest(false);

        expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
    });

    test('_finishFailedTest: _sendLog should be called with failure message, finishTestItem should be called with parameters', () => {
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

    test('_finishSkippedTest: finishTestItem should be called with parameters', () => {
        const expectedFinishTestItemParameter = {
            status: 'skipped',
            retry: false,
        };
        reporter.tempTestId = 'tempTestId';

        reporter._finishSkippedTest(false);

        expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', expectedFinishTestItemParameter);
    });
});
