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

const RPClient = require('@reportportal/client-javascript');
const getOptions = require('./utils/getOptions');
const {
    getClientInitObject, getSuiteStartObject,
    getStartLaunchObject, getTestStartObject, getStepStartObject,
    getAgentInfo, getCodeRef, getFullTestName, getFullStepName,
} = require('./utils/objectUtils');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const logLevels = {
    ERROR: 'error',
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
};

const promiseErrorHandler = (promise) => {
    promise.catch((err) => {
        console.error(err);
    });
};

class JestReportPortal {
    constructor(globalConfig, options) {
        const agentInfo = getAgentInfo();
        this.reportOptions = getClientInitObject(getOptions.options(options));
        if(this.reportOptions.enabled ==='false') return {invalid:true};
        this.client = new RPClient(this.reportOptions, agentInfo);
        this.tempSuiteIds = new Map();
        this.tempTestIds = new Map();
        this.tempStepId = null;
        this.promises = [];
    }

    // eslint-disable-next-line no-unused-vars
    onRunStart() {
        const startLaunchObj = getStartLaunchObject(this.reportOptions);
        const { tempId, promise } = this.client.startLaunch(startLaunchObj);

        this.tempLaunchId = tempId;
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    // eslint-disable-next-line no-unused-vars
    onTestResult(test, testResult) {
        let suiteDuration = 0;
        let testDuration = 0;
        for (let result = 0; result < testResult.testResults.length; result++) {
            suiteDuration += testResult.testResults[result].duration;
            if (testResult.testResults[result].ancestorTitles.length !== 1) {
                testDuration += testResult.testResults[result].duration;
            }
        }

        testResult.testResults.forEach((t) => {
            if (t.ancestorTitles.length > 0) {
                this._startSuite(t.ancestorTitles[0], test.path, suiteDuration);
            }
            if (t.ancestorTitles.length > 1) {
                this._startTest(t, test.path, testDuration);
            }

            if (!t.invocations) {
                this._startStep(t, false, test.path);
                this._finishStep(t, false);
                return;
            }

            for (let i = 0; i < t.invocations; i++) {
                const isRetried = t.invocations !== 1;

                this._startStep(t, isRetried, test.path);
                this._finishStep(t, isRetried);
            }
        });

        this.tempTestIds.forEach((tempTestId, key) => {
            this._finishTest(tempTestId, key);
        });
        this.tempSuiteIds.forEach((tempSuiteId, key) => {
            this._finishSuite(tempSuiteId, key);
        });
    }

    // eslint-disable-next-line no-unused-vars
    async onRunComplete() {
        await Promise.all(this.promises);
        if (this.reportOptions.launchId) return;
        const { promise } = this.client.finishLaunch(this.tempLaunchId);

        if (this.reportOptions.logLaunchLink === true) {
            promise.then((response) => {
                console.log(`\nReportPortal Launch Link: ${response.link}`);
            });
        }

        promiseErrorHandler(promise);
        await promise;
    }

    _startSuite(suiteName, path, suiteDuration) {
        if (this.tempSuiteIds.get(suiteName)) {
            return;
        }
        const codeRef = getCodeRef(path, suiteName);
        const { tempId, promise } = this.client.startTestItem(getSuiteStartObject(suiteName, codeRef, suiteDuration),
            this.tempLaunchId);

        this.tempSuiteIds.set(suiteName, tempId);
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _startTest(test, testPath, testDuration) {
        if (this.tempTestIds.get(test.ancestorTitles.join('/'))) {
            return;
        }

        const tempSuiteId = this.tempSuiteIds.get(test.ancestorTitles[0]);
        const fullTestName = getFullTestName(test);
        const codeRef = getCodeRef(testPath, fullTestName);
        const testStartObj = getTestStartObject(
            test.ancestorTitles[test.ancestorTitles.length - 1], codeRef, testDuration,
        );
        const parentId = this.tempTestIds.get(test.ancestorTitles.slice(0, -1).join('/')) || tempSuiteId;
        const { tempId, promise } = this.client.startTestItem(testStartObj, this.tempLaunchId, parentId);

        this.tempTestIds.set(fullTestName, tempId);
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _startStep(test, isRetried, testPath) {
        const tempSuiteId = this.tempSuiteIds.get(test.ancestorTitles[0]);
        const fullStepName = getFullStepName(test);
        const codeRef = getCodeRef(testPath, fullStepName);
        const stepDuration = test.duration;
        const stepStartObj = getStepStartObject(test.title, isRetried, codeRef, stepDuration);
        const parentId = this.tempTestIds.get(test.ancestorTitles.join('/')) || tempSuiteId;
        const { tempId, promise } = this.client.startTestItem(stepStartObj, this.tempLaunchId, parentId);

        this.tempStepId = tempId;
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _finishStep(test, isRetried) {
        const errorMsg = test.failureMessages[0];

        switch (test.status) {
        case testItemStatuses.PASSED:
            this._finishPassedStep(isRetried);
            break;
        case testItemStatuses.FAILED:
            this._finishFailedStep(errorMsg, isRetried);
            break;
        default:
            this._finishSkippedStep(isRetried);
        }
    }

    _finishPassedStep(isRetried) {
        const status = testItemStatuses.PASSED;
        const finishTestObj = { status, retry: isRetried };
        const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _finishFailedStep(failureMessage, isRetried) {
        const status = testItemStatuses.FAILED;
        const finishTestObj = { status, retry: isRetried };

        this._sendLog(failureMessage);

        const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _sendLog(message) {
        const logObject = {
            message,
            level: logLevels.ERROR,
        };
        const { promise } = this.client.sendLog(this.tempStepId, logObject);

        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _finishSkippedStep(isRetried) {
        const status = 'skipped';
        const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
        const finishTestObj = {
            status,
            retry: isRetried,
            ...(issue && { issue }),
        };
        const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _finishTest(tempTestId, key) {
        if (!tempTestId) return;

        const { promise } = this.client.finishTestItem(tempTestId, {});

        this.tempTestIds.delete(key);
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }

    _finishSuite(tempSuiteId, key) {
        if (!tempSuiteId) return;

        const { promise } = this.client.finishTestItem(tempSuiteId, {});

        this.tempSuiteIds.delete(key);
        promiseErrorHandler(promise);
        this.promises.push(promise);
    }
}

module.exports = JestReportPortal;
