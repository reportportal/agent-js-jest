const getOptions = require('./utils/getOptions');
const RPClient = require('reportportal-client');
const { getClientInitObject, getSuiteStartObject,
        getStartLaunchObject, getTestStartObject, getAgentInfo, getCodeRef, getFullTestName } = require('./utils/objectUtils');

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
        const agentInfo = getAgentInfo();
        this.globalConfig = globalConfig;
        this.reportOptions = getClientInitObject(getOptions.options(options));
        this.client = new RPClient(this.reportOptions, agentInfo);
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

        this._startSuite(suiteName, test.path);
        testResult.testResults.forEach(t => {
            if (!t.invocations) {
                this._startTest(t, false, test.path);
                this._finishTest(t, false);
                return;
            }

            for (let i = 0; i < t.invocations; i++) {
                const isRetried = t.invocations !== 1;

                this._startTest(t, isRetried, test.path);
                this._finishTest(t, isRetried);
            }
        });

        this._finishSuite();
    }

    // eslint-disable-next-line no-unused-vars
    onRunComplete (contexts, results) {
        const { promise } = this.client.finishLaunch(this.tempLaunchId);

        promiseErrorHandler(promise);
    }

    _startSuite (suiteName, path) {
        const codeRef = getCodeRef(path, suiteName);
        const { tempId, promise } = this.client.startTestItem(getSuiteStartObject(suiteName, codeRef),
            this.tempLaunchId);

        promiseErrorHandler(promise);
        this.tempSuiteId = tempId;
    }

    _startTest (test, isRetried, testPath) {
        const fullTestName = getFullTestName(test);
        const codeRef = getCodeRef(testPath, fullTestName);
        const testStartObj = getTestStartObject(test.title, isRetried, codeRef);
        const { tempId, promise } = this.client.startTestItem(testStartObj, this.tempLaunchId, this.tempSuiteId);

        promiseErrorHandler(promise);
        this.tempTestId = tempId;
    }

    _finishTest (test, isRetried) {
        let errorMsg = test.failureMessages[0];

        switch (test.status) {
            case testItemStatuses.PASSED:
                this._finishPassedTest(isRetried);
                break;
            case testItemStatuses.FAILED:
                this._finishFailedTest(errorMsg, isRetried);
                break;
            case testItemStatuses.SKIPPED:
                this._finishSkippedTest(isRetried);
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unsupported test Status!!!');
        }
    }

    _finishPassedTest (isRetried) {
        const status = testItemStatuses.PASSED;
        const finishTestObj = { status, retry: isRetried };
        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishFailedTest (failureMessage, isRetried) {
        const status = testItemStatuses.FAILED;
        const finishTestObj = { status, retry: isRetried };

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

    _finishSkippedTest (isRetried) {
        const status = 'skipped';
        const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
        const finishTestObj = Object.assign({
            status,
            retry: isRetried,
        }, issue && { issue });
        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishSuite () {
        const { promise } = this.client.finishTestItem(this.tempSuiteId, {});

        promiseErrorHandler(promise);
    }
}

module.exports = JestReportPortal;
