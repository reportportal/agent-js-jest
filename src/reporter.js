/*
 *  Copyright 2024 EPAM Systems
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

const stripAnsi = require('strip-ansi');
const RPClient = require('@reportportal/client-javascript');
const getOptions = require('./utils/getOptions');
const ReportingApi = require('./reportingApi');
const {
  getAgentOptions,
  getSuiteStartObject,
  getStartLaunchObject,
  getTestStartObject,
  getStepStartObject,
  getAgentInfo,
  getCodeRef,
  getFullTestName,
  getFullStepName,
} = require('./utils/objectUtils');
const { TEST_ITEM_STATUSES, LOG_LEVEL } = require('./constants');

const promiseErrorHandler = (promise) => {
  promise.catch((err) => {
    console.error(err);
  });
};

class JestReportPortal {
  constructor(globalConfig, options) {
    const agentInfo = getAgentInfo();
    this.reportOptions = getAgentOptions(getOptions.options(options));
    this.client = new RPClient(this.reportOptions, agentInfo);
    this.tempSuiteIds = new Map();
    this.tempTestIds = new Map();
    this.tempStepIds = new Map();
    this.tempStepId = null;
    this.promises = [];

    global.ReportingApi = new ReportingApi(this);
  }

  onRunStart() {
    const startLaunchObj = getStartLaunchObject(this.reportOptions);
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);

    this.tempLaunchId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  // Not called for `skipped` and `todo` specs
  onTestCaseStart(test, testCaseStartInfo) {
    if (testCaseStartInfo.ancestorTitles.length > 0) {
      this._startSuite(testCaseStartInfo.ancestorTitles[0], test.path);
    }
    if (testCaseStartInfo.ancestorTitles.length > 1) {
      this._startTest(testCaseStartInfo, test.path);
    }

    const isRetried = !!this.tempStepIds.get(getFullStepName(testCaseStartInfo));

    this._startStep(testCaseStartInfo, isRetried, test.path);
  }

  // Not called for `skipped` and `todo` specs
  onTestCaseResult(test, testCaseStartInfo) {
    this._finishStep(testCaseStartInfo);
  }

  // Handling `skipped` tests and their ancestors
  onTestResult(test, testResult) {
    let suiteDuration = 0;
    let testDuration = 0;

    const skippedTests = testResult.testResults.filter(
      (t) => t.status === TEST_ITEM_STATUSES.SKIPPED,
    );

    for (let index = 0; index < skippedTests.length; index++) {
      const currentTest = skippedTests[index];

      suiteDuration += currentTest.duration;
      if (currentTest.ancestorTitles.length !== 1) {
        testDuration += currentTest.duration;
      }
    }

    skippedTests.forEach((t) => {
      if (t.ancestorTitles.length > 0) {
        this._startSuite(t.ancestorTitles[0], test.path, suiteDuration);
      }
      if (t.ancestorTitles.length > 1) {
        this._startTest(t, test.path, testDuration);
      }

      if (!t.invocations) {
        this._startStep(t, false, test.path);
        this._finishStep(t);
        return;
      }

      for (let i = 0; i < t.invocations; i++) {
        const isRetried = t.invocations !== 1;

        this._startStep(t, isRetried, test.path);
        this._finishStep(t);
      }
    });

    this.tempTestIds.forEach((tempTestId, key) => {
      this._finishTest(tempTestId, key);
    });
    this.tempSuiteIds.forEach((tempSuiteId, key) => {
      this._finishSuite(tempSuiteId, key);
    });
  }

  async onRunComplete() {
    await Promise.all(this.promises);
    if (this.reportOptions.launchId) {
      return;
    }
    const { promise } = this.client.finishLaunch(this.tempLaunchId);

    promiseErrorHandler(promise);
    await promise;
  }

  _startSuite(suiteName, path, suiteDuration) {
    if (this.tempSuiteIds.get(suiteName)) {
      return;
    }
    const codeRef = getCodeRef(path, suiteName);
    const { tempId, promise } = this.client.startTestItem(
      getSuiteStartObject(suiteName, codeRef, suiteDuration),
      this.tempLaunchId,
    );

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
      test.ancestorTitles[test.ancestorTitles.length - 1],
      codeRef,
      testDuration,
    );
    const parentId =
      this.tempTestIds.get(test.ancestorTitles.slice(0, -1).join('/')) || tempSuiteId;
    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId,
    );

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
    const { tempId, promise } = this.client.startTestItem(
      stepStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.tempStepIds.set(fullStepName, tempId);
    this.tempStepId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishStep(test) {
    const errorMsg = test.failureMessages[0];

    switch (test.status) {
      case TEST_ITEM_STATUSES.PASSED:
        this._finishPassedStep();
        break;
      case TEST_ITEM_STATUSES.FAILED:
        this._finishFailedStep(errorMsg);
        break;
      default:
        this._finishSkippedStep();
    }
  }

  _finishPassedStep() {
    const status = TEST_ITEM_STATUSES.PASSED;
    const { promise } = this.client.finishTestItem(this.tempStepId, { status });

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishFailedStep(failureMessage) {
    const status = TEST_ITEM_STATUSES.FAILED;
    const description =
      this.reportOptions.extendTestDescriptionWithLastError === false
        ? null
        : `\`\`\`error\n${stripAnsi(failureMessage)}\n\`\`\``;
    const finishTestObj = { status, ...(description && { description }) };

    this.sendLog({ message: failureMessage, level: LOG_LEVEL.ERROR });

    const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  sendLog({ level = LOG_LEVEL.INFO, message = '', file, time }) {
    const newMessage = stripAnsi(message);
    const { promise } = this.client.sendLog(
      this.tempStepId,
      {
        message: newMessage,
        level,
        time: time || this.client.helpers.now(),
      },
      file,
    );

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishSkippedStep() {
    const status = 'skipped';
    const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
    const finishTestObj = {
      status,
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
