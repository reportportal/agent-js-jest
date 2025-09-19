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

const fs = require("fs");
const path = require("path");

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
  onTestStart() { }

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

    this._startStep(testCaseStartInfo, test.path);
  }

  // TODO: cover with tests
  // Not called for `skipped` and `todo` specs
  onTestCaseResult(test, testCaseStartInfo) {
    this._finishStep(testCaseStartInfo, test.path);
  }

  onTestResult(test, testResult) {
    // Handling `skipped` tests and their ancestors
    testResult.testResults.forEach((testCaseInfo) => {
      if (testCaseInfo.status === TEST_ITEM_STATUSES.SKIPPED) {
        const testCaseWithStartTime = { startedAt: new Date().valueOf(), ...testCaseInfo };
        this._startSuites(testCaseInfo.ancestorTitles, test.path, testCaseWithStartTime.startedAt);

        this._startStep(testCaseWithStartTime, test.path);
        this._finishStep(testCaseWithStartTime, test.path);
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

  _startStep(test, testPath) {
    const fullStepName = getFullStepName(test);
    const codeRef = getCodeRef(testPath, fullStepName);
    const retryIds = this.tempStepIds.get(codeRef);
    const isRetried = !!retryIds;

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
    // store item ids as array to not overwrite retry ids
    let tempIdToStore = [tempId];

    if (isRetried) {
      tempIdToStore = retryIds.concat(tempIdToStore);
    }

    this.tempStepIds.set(codeRef, tempIdToStore);
    this.tempStepId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _finishStep(test, testPath) {
    const fullName = getFullStepName(test);
    const codeRef = getCodeRef(testPath, fullName);
    const tempStepIds = this.tempStepIds.get(codeRef);
    const tempStepId = Array.isArray(tempStepIds) ? tempStepIds.shift() : undefined;

    if (!tempStepId) {
      console.error(`Could not finish Test Step - "${codeRef}". tempId not found`);
      return;
    }

    const errorMsg = test.failureMessages[0];

    switch (test.status) {
      case TEST_ITEM_STATUSES.PASSED:
        this._finishPassedStep(tempStepId);
        break;
      case TEST_ITEM_STATUSES.FAILED:
        this._finishFailedStep(tempStepId, errorMsg, test);
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

  _finishFailedStep(tempStepId, failureMessage, test) {
    const status = TEST_ITEM_STATUSES.FAILED;
    const description =
      this.reportOptions.extendTestDescriptionWithLastError === false
        ? null
        : `\`\`\`error\n${stripAnsi(failureMessage)}\n\`\`\``;
    const finishTestObj = { status, ...(description && { description }) };

    this._sendLog({ message: failureMessage, level: LOG_LEVEL.ERROR, tempStepId });

    const imagePath = this._findFile(this.reportOptions.artifactsPath, test.fullName, 'testFnFailure.png');
    const videoPath = this._findFile(this.reportOptions.artifactsPath, test.fullName, 'test.mp4');

    if (imagePath) {
      const image = {
        name: 'testFnFailure.png',
        type: 'image/png',
        content: fs.readFileSync(imagePath),
      };
      this._sendLog({ level: LOG_LEVEL.ERROR, message: 'Screenshot:', file: image, tempStepId });
    }
    if (videoPath) {
      const video = {
        name: 'test.mp4',
        type: 'video/mp4',
        content: fs.readFileSync(videoPath),
      };
      this._sendLog({ level: LOG_LEVEL.ERROR, message: 'Video:', file: video, tempStepId });
    }

    const { promise } = this.client.finishTestItem(tempStepId, finishTestObj);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _findFile(root, folderPart, fileName) {
    function search(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name.includes(folderPart)) {
            const candidate = path.join(fullPath, fileName);
            if (fs.existsSync(candidate)) {
              return candidate;
            }
          }
          const result = search(fullPath);
          if (result) return result;
        }
      }

      return null;
    }

    return search(root);
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
