/*
 *  Copyright 2025 EPAM Systems
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
  getStartLaunchObject,
  getAgentInfo,
  getCodeRef,
  getFullStepName,
} = require('./utils/objectUtils');
const { TEST_ITEM_STATUSES, LOG_LEVEL, TEST_ITEM_TYPES } = require('./constants');

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
    this.tempStepIds = new Map();
    // TODO: Remove and use `this.tempStepIds` instead.
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

  // FYI. In most cases it is not even called. It cannot be used for suites handling.
  onTestStart() {}

  _startSuites(suiteTitles, filePath, startTime) {
    suiteTitles.reduce((suitePath, suiteTitle) => {
      const fullSuiteName = suitePath ? `${suitePath}/${suiteTitle}` : suiteTitle;
      const codeRef = getCodeRef(filePath, fullSuiteName);
      const parentCodeRef = getCodeRef(filePath, suitePath);

      this._startSuite(suiteTitle, codeRef, parentCodeRef, startTime);
      return fullSuiteName;
    }, '');
  }

  // TODO: cover with tests
  // Not called for `skipped` and `todo` specs
  onTestCaseStart(test, testCaseStartInfo) {
    this._startSuites(testCaseStartInfo.ancestorTitles, test.path, testCaseStartInfo.startedAt);

    const isRetried = !!this.tempStepIds.get(getFullStepName(testCaseStartInfo));
    this._startStep(testCaseStartInfo, test.path, isRetried);
  }

  // TODO: cover with tests
  // Not called for `skipped` and `todo` specs
  onTestCaseResult(test, testCaseStartInfo) {
    this._finishStep(testCaseStartInfo);
  }

  onTestResult(test, testResult) {
    // Handling `skipped` tests and their ancestors
    const skippedTests = testResult.testResults.filter(
      (t) => t.status === TEST_ITEM_STATUSES.SKIPPED,
    );

    skippedTests.forEach((testCaseInfo) => {
      const testCaseWithStartTime = { startedAt: new Date().valueOf(), ...testCaseInfo };
      this._startSuites(testCaseInfo.ancestorTitles, test.path, testCaseWithStartTime.startedAt);

      if (testCaseWithStartTime.invocations) {
        for (let i = 0; i < testCaseWithStartTime.invocations; i++) {
          const isRetried = i > 0;

          this._startStep(testCaseWithStartTime, test.path, isRetried);
          this._finishStep(testCaseWithStartTime);
        }
      } else {
        this._startStep(testCaseWithStartTime, test.path);
        this._finishStep(testCaseWithStartTime);
      }
    });

    const suiteFilePathToFinish = getCodeRef(testResult.testFilePath);

    // Finishing suites that are related to the test file
    this.tempSuiteIds.forEach((suiteTempId, suiteFullName) => {
      if (suiteFullName.includes(suiteFilePathToFinish)) {
        this._finishSuite(suiteTempId, suiteFullName);
      }
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

  _startSuite(title, codeRef, parentCodeRef = '', startTime = new Date().valueOf()) {
    if (this.tempSuiteIds.get(codeRef)) {
      return;
    }

    const testStartObj = {
      type: TEST_ITEM_TYPES.SUITE,
      name: title,
      codeRef,
      startTime,
    };
    const parentId = this.tempSuiteIds.get(parentCodeRef);
    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.tempSuiteIds.set(codeRef, tempId);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _startStep(test, testPath, isRetried = false) {
    const fullStepName = getFullStepName(test);
    const codeRef = getCodeRef(testPath, fullStepName);
    const stepStartObj = {
      type: TEST_ITEM_TYPES.STEP,
      name: test.title,
      codeRef,
      startTime: test.startedAt,
      retry: isRetried,
    };

    const parentFullName = test.ancestorTitles.join('/');
    const parentCodeRef = getCodeRef(testPath, parentFullName);
    const parentId = this.tempSuiteIds.get(parentCodeRef);

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

    const fullName = getFullStepName(test);
    const tempStepId = this.tempStepIds.get(fullName);

    if (tempStepId === undefined) {
      console.error(`Could not finish Test Step - "${fullName}". tempId not found`);
      return;
    }

    switch (test.status) {
      case TEST_ITEM_STATUSES.PASSED:
        this._finishPassedStep(tempStepId);
        break;
      case TEST_ITEM_STATUSES.FAILED:
        this._finishFailedStep(tempStepId, errorMsg);
        break;
      default:
        this._finishSkippedStep(tempStepId);
    }
  }

  _finishPassedStep(tempStepId) {
    const status = TEST_ITEM_STATUSES.PASSED;
    const { promise } = this.client.finishTestItem(tempStepId, { status });

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishFailedStep(tempStepId, failureMessage) {
    const status = TEST_ITEM_STATUSES.FAILED;
    const description =
      this.reportOptions.extendTestDescriptionWithLastError === false
        ? null
        : `\`\`\`error\n${stripAnsi(failureMessage)}\n\`\`\``;
    const finishTestObj = { status, ...(description && { description }) };

    this._sendLog({ message: failureMessage, level: LOG_LEVEL.ERROR, tempStepId });

    const { promise } = this.client.finishTestItem(tempStepId, finishTestObj);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _sendLog({ level = LOG_LEVEL.INFO, message = '', file, time, tempStepId }) {
    const newMessage = stripAnsi(message);
    const { promise } = this.client.sendLog(
      tempStepId === undefined ? this.tempStepId : tempStepId,
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

  _finishSkippedStep(tempStepId) {
    const status = 'skipped';
    const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
    const finishTestObj = {
      status,
      ...(issue && { issue }),
    };
    const { promise } = this.client.finishTestItem(tempStepId, finishTestObj);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishSuite(tempTestId, key) {
    if (!tempTestId) {
      return;
    }

    const { promise } = this.client.finishTestItem(tempTestId, {});

    this.tempSuiteIds.delete(key);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }
}

module.exports = JestReportPortal;
