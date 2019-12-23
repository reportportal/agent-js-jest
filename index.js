const getOptions = require('./utils/getOptions');
const RPClient = require('reportportal-client');
const { getClientInitObject, getSuiteStartObject,
        getStartLaunchObject, getTestStartObject } = require('./utils/objectUtils');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const logLevels = {
    ERROR: 'error',
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn'
};

const promiseErrorHandler = promise => {
    promise.catch(err => {
        console.error(err);
    });
};


class JestReportPortal {
    constructor (globalConfig, options) {
        this.globalConfig = globalConfig;
        this.reportOptions = getClientInitObject(getOptions.options(options));
        this.client = new RPClient(this.reportOptions);
        this.tempSuiteId = null;
        this.tempTestId = null;
    }

    // eslint-disable-next-line no-unused-vars
    onRunStart (aggregatedResults, options) {
        const startLaunchObj = getStartLaunchObject(this.reportOptions);
        let { tempId, promise } = this.client.startLaunch(startLaunchObj);

        this.tempLaunchId = tempId;
        promiseErrorHandler(promise);
    }

    // eslint-disable-next-line no-unused-vars
    onTestResult (test, testResult, aggregatedResults) {
        let suiteName = testResult.testResults[0].ancestorTitles[0];

        this._startSuite(suiteName);

        testResult.testResults.forEach(t => {
            this._startTest(t.title);
            this._finishTest(t);
        });

        this._finishSuite();
    }

    // eslint-disable-next-line no-unused-vars
    onRunComplete (contexts, results) {
        const { promise } = this.client.finishLaunch(this.tempLaunchId);

        promiseErrorHandler(promise);
    }

    _startSuite (suiteName) {
        const { tempId, promise } = this.client.startTestItem(getSuiteStartObject(suiteName),
            this.tempLaunchId);

        promiseErrorHandler(promise);
        this.tempSuiteId = tempId;
    }

    _startTest (testName) {
        const testStartObj = getTestStartObject(testName);
        const { tempId, promise } = this.client.startTestItem(testStartObj, this.tempLaunchId, this.tempSuiteId);

        promiseErrorHandler(promise);
        this.tempTestId = tempId;
    }

    _finishTest (test) {
        let errorMsg = test.failureMessages[0];

        switch (test.status) {
            case testItemStatuses.PASSED:
                this._finishPassedTest();
                break;
            case testItemStatuses.FAILED:
                this._finishFailedTest(errorMsg);
                break;
            case testItemStatuses.SKIPPED:
                this._finishSkippedTest();
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unsupported test Status!!!');
        }
    }

    _finishPassedTest () {
        let status = testItemStatuses.PASSED;

        const finishTestObj = { status };
        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishFailedTest (failureMessage) {
        let finishTestObj = {
            status: testItemStatuses.FAILED,
        };

        this._sendLog(failureMessage);

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _sendLog (message) {
        let logObject = {
            message: message,
            level: logLevels.ERROR
        };
        const { promise } = this.client.sendLog(this.tempTestId, logObject);

        promiseErrorHandler(promise);
    }

    _finishSkippedTest () {
        let finishTestObj = {
            status: 'skipped',
        };

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishSuite () {
        const { promise } = this.client.finishTestItem(this.tempSuiteId, {});

        promiseErrorHandler(promise);
    }
}

module.exports = JestReportPortal;
