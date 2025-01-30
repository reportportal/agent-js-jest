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
const JestReportPortal = require('../src');
const { TEST_ITEM_STATUSES, LOG_LEVEL, TEST_ITEM_TYPES } = require('../src/constants');
const pjson = require('../package.json');
const {
  duration,
  skippedTestResult,
  testResult,
  testResultWithSkipped,
  testObj,
  mockDate,
  mockFile,
  testFilePath,
} = require('./mocks/data');

const GLOBAL_CONFIG = {};
const options = getOptions();
const currentDate = new Date();
const currentDateInMs = currentDate.valueOf();
const RealDate = Date;
const systemAttr = {
  key: 'agent',
  value: `${pjson.name}|${pjson.version}`,
  system: true,
};

describe('Reporter', () => {
  /**
   * @type {JestReportPortal}
   */
  let reporter;

  beforeAll(() => {
    reporter = new JestReportPortal(GLOBAL_CONFIG, options);
    reporter.client = new RPClient();
  });

  beforeEach(() => {
    global.Date = jest.fn((...args) =>
      args.length ? new RealDate(...args) : new RealDate(currentDate),
    );
    Object.assign(Date, RealDate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    reporter.tempLaunchId = '';
    reporter.tempStepIds = new Map();
    reporter.tempSuiteIds = new Map();
    reporter.tempStepId = null;
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
    test('should call start suites method for skipped tests if any. startedAt should be fell back', () => {
      const spyStartSuites = jest.spyOn(reporter, '_startSuites');

      reporter.onTestResult(testObj, testResultWithSkipped);

      expect(spyStartSuites).toHaveBeenCalledWith(
        skippedTestResult.ancestorTitles,
        testObj.path,
        currentDateInMs,
      );
    });
    test('should not start any suites in case of no skipped tests', () => {
      const spyStartSuites = jest.spyOn(reporter, '_startSuites');

      reporter.onTestResult(testObj, testResult);

      expect(spyStartSuites).toHaveBeenCalledTimes(0);
    });

    test('should start and finish retries in case of any invocations of skipped tests', () => {
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');

      reporter.onTestResult(testObj, testResultWithSkipped);
      const skippedTestResultWithStartedAt = { startedAt: currentDateInMs, ...skippedTestResult };

      expect(spyStartStep).toHaveBeenNthCalledWith(
        1,
        skippedTestResultWithStartedAt,
        testObj.path,
        false,
      );
      expect(spyStartStep).toHaveBeenNthCalledWith(
        2,
        skippedTestResultWithStartedAt,
        testObj.path,
        true,
      );
      expect(spyFinishStep).toHaveBeenCalledWith(skippedTestResultWithStartedAt);
      expect(spyStartStep).toHaveBeenCalledTimes(2);
      expect(spyFinishStep).toHaveBeenCalledTimes(2);
    });

    test('should start and finish just skipped test in case of no or empty invocations', () => {
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');

      const { invocations, ...skippedTestResultWithoutInvocations } = skippedTestResult;

      const testResult = {
        testResults: [skippedTestResultWithoutInvocations],
        testFilePath,
      };

      reporter.onTestResult(testObj, testResult);

      const skippedTestResultWithStartedAt = {
        startedAt: currentDateInMs,
        ...skippedTestResultWithoutInvocations,
      };

      expect(spyStartStep).toHaveBeenCalledWith(skippedTestResultWithStartedAt, testObj.path);
      expect(spyFinishStep).toHaveBeenCalledWith(skippedTestResultWithStartedAt);
      expect(spyStartStep).toHaveBeenCalledTimes(1);
      expect(spyFinishStep).toHaveBeenCalledTimes(1);
    });

    test('should finish all suites that belongs to the file where test is located', () => {
      const spyFinishSuite = jest.spyOn(reporter, '_finishSuite');
      reporter.tempSuiteIds = new Map([
        ['C:/testProject/example.js/Failed suite name', 'startTestItem'],
        ['C:/testProject/example.js/Failed suite name/Failed test name', 'startTestItem'],
      ]);

      reporter.onTestResult(testObj, testResultWithSkipped);

      expect(spyFinishSuite).toHaveBeenCalledTimes(4);
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        1,
        'startTestItem',
        'C:/testProject/example.js/Failed suite name',
      );
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        2,
        'startTestItem',
        'C:/testProject/example.js/Failed suite name/Failed test name',
      );
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        3,
        'startTestItem',
        'C:/testProject/example.js/Skipped suite name',
      );
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        4,
        'startTestItem',
        'C:/testProject/example.js/Skipped suite name/Skipped test name',
      );
    });

    test('should finish all suites that belongs to the file even if there are no skipped tests', () => {
      const spyFinishSuite = jest.spyOn(reporter, '_finishSuite');
      reporter.tempSuiteIds = new Map([
        ['C:/testProject/example.js/Failed suite name', 'startTestItem'],
        ['C:/testProject/example.js/Failed suite name/Failed test name', 'startTestItem'],
      ]);

      reporter.onTestResult(testObj, testResult);

      expect(spyFinishSuite).toHaveBeenCalledTimes(2);
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        1,
        'startTestItem',
        'C:/testProject/example.js/Failed suite name',
      );
      expect(spyFinishSuite).toHaveBeenNthCalledWith(
        2,
        'startTestItem',
        'C:/testProject/example.js/Failed suite name/Failed test name',
      );
    });
  });

  describe('onRunComplete', () => {
    test('finishLaunch should be called with tempLaunchId', async () => {
      reporter.tempLaunchId = 'tempLaunchId';

      await reporter.onRunComplete();

      expect(reporter.client.finishLaunch).toHaveBeenCalledWith('tempLaunchId');
    });
  });

  describe('_startSuite', () => {
    test('startTestItem should be called with parameters to start suite with parent', () => {
      const parentCodeRef = 'example.js/Parent suite name';
      const suiteCodeRef = 'example.js/Parent suite name/Suite name';

      reporter.tempLaunchId = 'tempLaunchId';
      reporter.tempSuiteIds = new Map([[parentCodeRef, 'startTestItem']]);

      reporter._startSuite('Suite name', suiteCodeRef, parentCodeRef, currentDateInMs);

      const expectedStartSuiteObj = {
        type: TEST_ITEM_TYPES.SUITE,
        name: 'Suite name',
        codeRef: suiteCodeRef,
        startTime: currentDateInMs,
      };
      const expectedTempSuiteIds = new Map([
        [parentCodeRef, 'startTestItem'],
        [suiteCodeRef, 'startTestItem'],
      ]);

      expect(reporter.client.startTestItem).toHaveBeenCalledWith(
        expectedStartSuiteObj,
        'tempLaunchId',
        'startTestItem',
      );
      expect(reporter.tempSuiteIds).toEqual(expectedTempSuiteIds);
    });

    test('startTestItem should be called with parameters to start suite without parent', () => {
      const suiteCodeRef = 'example.js/Suite name';

      reporter.tempLaunchId = 'tempLaunchId';

      reporter._startSuite('Suite name', suiteCodeRef, 'example.js', currentDateInMs);

      const expectedStartSuiteObj = {
        type: TEST_ITEM_TYPES.SUITE,
        name: 'Suite name',
        codeRef: suiteCodeRef,
        startTime: currentDateInMs,
      };
      const expectedTempSuiteIds = new Map([[suiteCodeRef, 'startTestItem']]);

      expect(reporter.client.startTestItem).toHaveBeenCalledWith(
        expectedStartSuiteObj,
        'tempLaunchId',
        undefined,
      );
      expect(reporter.tempSuiteIds).toEqual(expectedTempSuiteIds);
    });

    test('startTestItem should not be called if suite is already started', () => {
      const suiteCodeRef = 'example.js/Suite name';
      reporter.tempSuiteIds = new Map([[suiteCodeRef, 'startTestItem']]);

      reporter._startSuite('Suite name', suiteCodeRef, 'example.js', currentDateInMs);

      expect(reporter.client.startTestItem).not.toHaveBeenCalled();
    });
  });

  describe('_startStep', () => {
    test('startTestItem should be called with parameters to start step', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.tempSuiteIds = new Map([['example.js/Suite', 'startTestItem']]);

      reporter._startStep(
        { title: 'Step', ancestorTitles: ['Suite'], startedAt: currentDateInMs },
        testObj.path,
      );

      const expectedStartStepItemParameter = {
        type: TEST_ITEM_TYPES.STEP,
        name: 'Step',
        codeRef: 'example.js/Suite/Step',
        startTime: currentDateInMs,
        retry: false,
      };
      const expectedTempStepIds = new Map([['Suite/Step', 'startTestItem']]);

      expect(reporter.client.startTestItem).toHaveBeenCalledWith(
        expectedStartStepItemParameter,
        'tempLaunchId',
        'startTestItem',
      );
      expect(reporter.tempStepIds).toEqual(expectedTempStepIds);
      expect(reporter.tempStepId).toBe('startTestItem');
    });
  });

  describe('_sendLog', () => {
    test('sendLog should be called with parameters', () => {
      reporter.tempStepId = 'tempStepId';

      reporter._sendLog({ message: 'message', level: LOG_LEVEL.ERROR, file: mockFile });

      expect(reporter.client.sendLog).toHaveBeenCalledWith(
        'tempStepId',
        {
          message: 'message',
          level: LOG_LEVEL.ERROR,
          time: mockDate,
        },
        mockFile,
      );
    });
  });

  describe('_finishStep', () => {
    test('_finishPassedTest should be called if step status is passed', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter.tempStepIds.set('/fake test', 'tempStepId');

      reporter._finishStep({
        status: TEST_ITEM_STATUSES.PASSED,
        failureMessages: [],
        ancestorTitles: [],
        title: 'fake test',
      });

      expect(spyFinishPassedTest).toHaveBeenCalled();
      expect(spyFinishFailedTest).not.toHaveBeenCalled();
      expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishFailedStep should be called with error message if step status is failed', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter.tempStepIds.set('/fake test', 'tempStepId');

      reporter._finishStep(
        {
          status: TEST_ITEM_STATUSES.FAILED,
          failureMessages: ['error message'],
          ancestorTitles: [],
          title: 'fake test',
        },
        false,
      );

      expect(spyFinishFailedTest).toHaveBeenCalledWith('tempStepId', 'error message');
      expect(spyFinishPassedTest).not.toHaveBeenCalled();
      expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishPassedStep should be called if step status is skipped or any other', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter.tempStepIds.set('/fake test', 'tempStepId');

      reporter._finishStep({
        status: TEST_ITEM_STATUSES.SKIPPED,
        failureMessages: [],
        ancestorTitles: [],
        title: 'fake test',
      });

      expect(spyFinishSkippedTest).toHaveBeenCalled();
      expect(spyFinishPassedTest).not.toHaveBeenCalled();
      expect(spyFinishFailedTest).not.toHaveBeenCalled();
    });
  });

  describe('_finishSuite', () => {
    test('finishTestItem should be called with parameters, tempSuiteId should be deleted', () => {
      reporter.tempSuiteIds = new Map([['Suite', 'tempSuiteId']]);

      reporter._finishSuite('tempSuiteId', 'Suite');

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempSuiteId', {});
      expect(reporter.tempSuiteIds.get('Suite')).toEqual(undefined);
    });

    test('finishTestItem should not be called with parameters if there is no tempSuiteId', () => {
      reporter._finishSuite(undefined);

      expect(reporter.client.finishTestItem).not.toHaveBeenCalled();
    });
  });

  describe('_finishPassedStep', () => {
    test('finishTestItem should be called with parameters', () => {
      const expectedFinishTestItemParameter = {
        status: 'passed',
      };
      reporter.tempStepId = 'tempStepId';

      reporter._finishPassedStep('tempStepId', false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
        'tempStepId',
        expectedFinishTestItemParameter,
      );
    });
  });

  describe('_finishFailedStep', () => {
    test('sendLog should be called with failure message, finishTestItem should be called with parameters', () => {
      const spySendLog = jest.spyOn(reporter, '_sendLog');
      const errorMessage = 'error message';
      const tempStepId = 'tempStepId';
      const expectedFinishTestItemParameter = {
        status: 'failed',
        description: '```error\nerror message\n```',
      };
      reporter.tempStepId = tempStepId;

      reporter._finishFailedStep('tempStepId', errorMessage, false);

      expect(spySendLog).toHaveBeenCalledWith({
        message: errorMessage,
        level: LOG_LEVEL.ERROR,
        tempStepId: 'tempStepId',
      });
      expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
        tempStepId,
        expectedFinishTestItemParameter,
      );
    });

    test(
      'finishTestItem should be called without description parameter ' +
        'if extendTestDescriptionWithLastError is false',
      () => {
        const expectedFinishTestItemParameter = {
          status: 'failed',
        };
        reporter.tempStepId = 'tempStepId';
        reporter.reportOptions.extendTestDescriptionWithLastError = false;

        reporter._finishFailedStep('tempStepId', 'error message', false);

        expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
          'tempStepId',
          expectedFinishTestItemParameter,
        );
      },
    );
  });

  describe('_finishSkippedStep', () => {
    test('finishTestItem should be called with parameters', () => {
      const expectedFinishTestItemParameter = {
        status: 'skipped',
      };
      reporter.tempStepId = 'tempStepId';

      reporter._finishSkippedStep('tempStepId', false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
        'tempStepId',
        expectedFinishTestItemParameter,
      );
    });

    test('finishTestItem should be called with issue parameter if skippedIssue is false', () => {
      const expectedFinishTestItemParameter = {
        status: 'skipped',
        issue: { issueType: 'NOT_ISSUE' },
      };
      reporter.tempStepId = 'tempStepId';
      reporter.reportOptions.skippedIssue = false;

      reporter._finishSkippedStep('tempStepId', false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith(
        'tempStepId',
        expectedFinishTestItemParameter,
      );
    });
  });
});
