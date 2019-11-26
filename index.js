const getOptions = require('./utils/getOptions'),
    RPClient = require('reportportal-client-restler'),
    base_reporter = require('jest-reporters/lib/BaseReporter'),
    { getClientInitObject, getSuiteStartObject,
        getStartLaunchObject, getTestStartObject } = require('./utils/objectUtils');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' },

    logLevels = {
        ERROR: 'error',
        TRACE: 'trace',
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn'
    },


    promiseErrorHandler = promise => {
        promise.catch(err => {
            console.error(err);
        });
    };


class JestReportPortal extends base_reporter {
    constructor (globalConfig, options) {
        super();
        this.globalConfig = globalConfig;
        this.reportOptions = getClientInitObject(getOptions.options(options));
        this.client = new RPClient(this.reportOptions);
        this.tempSuiteIds = [];
        this.tempTestId = null;
    }

    getLastTempSuidId () {
        return this.tempSuiteIds[this.tempSuiteIds.length - 1]
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
        let suiteNames = testResult.testResults[0].ancestorTitles;
        
       suiteNames.forEach(name => {
        this._startSuite(name); 

       })

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

    _startSuite  (suiteName) {
        const { tempId, promise } = this.client.startTestItem(getSuiteStartObject(suiteName),
            this.tempLaunchId, this.getLastTempSuidId());
            

        promiseErrorHandler(promise);
        this.tempSuiteIds.push(tempId);
    }

    _startTest (testName) {
        const testStartObj = getTestStartObject(testName),

            { tempId, promise } = this.client.startTestItem(testStartObj,
                this.tempLaunchId,
                this.getLastTempSuidId());

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
        let status = testItemStatuses.PASSED,
            finishTestObj = { status };

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishFailedTest (failureMessage) {
        let message = `Stacktrace: ${failureMessage}\n`,
            finishTestObj = {
                status: testItemStatuses.FAILED,
                description: message
            };

        this._sendLog(message);

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
            issue: { issue_type: 'NOT_ISSUE' }
        };

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishSuite () {
        this.tempSuiteIds.forEach(item => {
            const { promise } = this.client.finishTestItem(item, {});

            promiseErrorHandler(promise);
        })
    }
}

module.exports = JestReportPortal;
