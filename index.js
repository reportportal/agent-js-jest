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

const { execSync } = require('child_process');
const stripAnsi = require('strip-ansi');
const RPClient = require('@reportportal/client-javascript');
const fs = require('fs');
const path = require('path');
const getOptions = require('./utils/getOptions');
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
    this.reportOptions = getAgentOptions(getOptions.options(options));
    this.client = new RPClient(this.reportOptions, agentInfo);
    this.tempSuiteIds = new Map();
    this.tempTestIds = new Map();
    this.tempStepId = null;
    this.promises = [];
  }

  onRunStart() {
    const startLaunchObj = getStartLaunchObject(this.reportOptions);
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);

    this.tempLaunchId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

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

  async onRunComplete() {
    await Promise.all(this.promises);
    if (this.reportOptions.launchId) {
      return;
    }
    const { promise } = this.client.finishLaunch(this.tempLaunchId);

    if (this.reportOptions.logLaunchLink === true) {
      promise.then((response) => {
        response.link = response.link.replace('-api', '');
        console.log(`\nReportPortal Launch Link: ${response.link}`);
        // Special code to save the launch url to an env var in bitrise to be used in a Slack message
        if (process.env.CI === 'true') {
          execSync(`envman add --key LAUNCH_URL --value "${response.link}"`);
          console.log(process.env.LAUNCH_URL)
        }
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
        this._finishFailedStep(errorMsg, isRetried, test);
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

  _finishFailedStep(failureMessage, isRetried, test) {
    const status = testItemStatuses.FAILED;
    const finishTestObj = { status, retry: isRetried };

    this._uploadScreenshot(test, this.tempStepId, failureMessage); // Custom function to upload screenshot on test failure

    const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  _sendLog(message) {
    const newMessage = stripAnsi(message);
    const logObject = {
      message: newMessage,
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

  /*
    * Custom function to upload screenshot on test failure
    * Sorts through artifacts/ dir and finds the latest device/timestamp directory
    * Then searches for a directory with a name that contains the test title
    * If found, it uploads the screenshot
  */
  async _uploadScreenshot(test, tempStepId, failureMessage) {
    const screenshotPath = await this._getScreenshotPath(test);
    if (!fs.existsSync(screenshotPath)) {
      console.error('Screenshot does not exist:', screenshotPath);
      return;
    }

    const fileContent = fs.readFileSync(screenshotPath);
    const fileObj = {
      name: path.basename(screenshotPath),
      type: 'image/png',
      content: fileContent.toString('base64')
    };

    const logData = {
      time: this.client.helpers.now(),
      message: failureMessage,
      level: 'ERROR',
    };

    try {
      const result = await this.client.sendLog(tempStepId, logData, fileObj);
      console.debug('Screenshot upload successful:', result);
      console.debug("For test: ", test.title);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      console.debug("For test: ", test.title);
    }
  }

  _getDirectoryName() {
    const baseDir = `artifacts/`;
    console.debug(`Current working directory: ${process.cwd()}`);
    fs.readdirSync(process.cwd()).forEach(file => {
      console.debug(file);
    });
    console.debug(`Looking for directories in: ${baseDir}`);
    try {
      const directories = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
      console.debug(`Found directories: ${directories.join(', ')}`);

      const sortedDirectories = directories.sort((a, b) => a.localeCompare(b));
      const latestDirectory = sortedDirectories.pop();
      console.debug(`Latest directory: ${latestDirectory}`);

      return latestDirectory;
    } catch (error) {
      console.error('Error finding the device/timestamp directory:', error);
      return null;
    }
  }



  async _getScreenshotPath(test) {
    const deviceName = this._getDirectoryName();
    if (!deviceName) {
      console.error("No device/timestamp directory found.");
      return null;
    }

    const baseDir = path.join(`artifacts`, deviceName);
    const normalizedTestTitle = this._normalizeStringForComparison(test.title);

    try {
      const directories = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      const matchingDir = directories.find(dir => this._normalizeStringForComparison(dir).includes(normalizedTestTitle));

      if (matchingDir) {
        const screenshotPath = path.join(baseDir, matchingDir, 'testFnFailure.png');
        console.debug(`Found matching directory: ${matchingDir}, screenshot path: ${screenshotPath}`); // Debug statement

        if (fs.existsSync(screenshotPath)) {
          return screenshotPath;
        } else {
          console.error(`Screenshot does not exist: ${screenshotPath}`);
        }
      } else {
          console.error(`No matching directory found for test title: ${test.title}`);
      }
    } catch (error) {
      console.error('Error searching for screenshot directory:', error);
    }
    return null;
  }


  _normalizeStringForComparison(str) {
    return str
    .toLowerCase() // Convert to lowercase
    .replace(/[.,/#!$%^&*;:{}=\-_`~()"'\[\]]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse multiple spaces into a single space
    .trim();
  }
}

module.exports = JestReportPortal;
