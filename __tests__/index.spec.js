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
const JestReportPortal = require('../index');
const pjson = require('../package.json');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const GLOBAL_CONFIG = {};
const options = getOptions();
const currentDate = new Date();
const RealDate = Date;
const systemAttr = {
  key: 'agent',
  value: `${pjson.name}|${pjson.version}`,
  system: true,
};
const duration = 5;
const testResult = {
  testResults: [
    {
      title: 'Title',
      status: 'failed',
      ancestorTitles: ['Suite name', 'Test name'],
      failureMessages: 'error message',
      invocations: 1,
      duration,
    },
  ],
};
const testObj = {
  path: `C:${path.sep}testProject${path.sep}example.js`,
};

describe('index script', () => {
  let reporter;

  beforeAll(() => {
    reporter = new JestReportPortal(GLOBAL_CONFIG, options);
    reporter.client = new RPClient();
  });

  beforeEach(() => {
    global.Date = jest.fn(
      (...args) =>
        (args.length
          ? new RealDate(...args)
          : new RealDate(currentDate)),
    );
    Object.assign(Date, RealDate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    reporter.tempLaunchId = '';
    reporter.tempSuiteIds = new Map();
    reporter.tempTestIds = new Map();
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
    test('startSuite, startTest, spyStartStep, finishTest, finishSuite, spyFinishStep'
            + 'should be called with parameters', () => {
      const spyStartSuite = jest.spyOn(reporter, '_startSuite');
      const spyStartTest = jest.spyOn(reporter, '_startTest');
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishTest = jest.spyOn(reporter, '_finishTest');
      const spyFinishSuite = jest.spyOn(reporter, '_finishSuite');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');
      reporter.tempTestIds = new Map([['tempTestId', '1234']]);
      reporter.tempSuiteIds = new Map([['tempSuiteId', '4321']]);

      reporter.onTestResult(testObj, testResult);

      expect(spyStartSuite).toHaveBeenCalledWith(testResult.testResults[0].ancestorTitles[0], testObj.path, duration);
      expect(spyStartTest).toHaveBeenCalledWith(testResult.testResults[0], testObj.path, duration);
      expect(spyStartStep).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
      expect(spyFinishStep).toHaveBeenCalledWith(testResult.testResults[0], false);
      expect(spyFinishTest).toHaveBeenCalledWith('1234', 'tempTestId');
      expect(spyFinishSuite).toHaveBeenCalledWith('4321', 'tempSuiteId');
    });

    test('startStep, finishStep should be called one times with second parameter \'false\' if there'
            + ' are no retries', () => {
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');

      reporter.onTestResult(testObj, testResult);

      expect(spyStartStep).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
      expect(spyFinishStep).toHaveBeenCalledWith(testResult.testResults[0], false);
      expect(spyStartStep).toHaveBeenCalledTimes(1);
      expect(spyFinishStep).toHaveBeenCalledTimes(1);
    });

    test('startStep, finishStep should be called two times with second parameter \'true\' if there'
            + ' are retries', () => {
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');
      const testResult = {
        testResults: [
          {
            title: 'Title',
            status: 'failed',
            ancestorTitles: ['Suite name', 'Test name'],
            failureMessages: 'error message',
            invocations: 2,
          },
        ],
      };

      reporter.onTestResult(testObj, testResult);

      expect(spyStartStep).toHaveBeenCalledWith(testResult.testResults[0], true, testObj.path);
      expect(spyFinishStep).toHaveBeenCalledWith(testResult.testResults[0], true);
      expect(spyStartStep).toHaveBeenCalledTimes(2);
      expect(spyFinishStep).toHaveBeenCalledTimes(2);
    });

    test('startStep, finishStep should be called ones with second parameter \'false\' if there is'
            + ' no invocations', () => {
      const spyStartStep = jest.spyOn(reporter, '_startStep');
      const spyFinishStep = jest.spyOn(reporter, '_finishStep');
      const testResult = {
        testResults: [
          {
            title: 'Title',
            status: 'failed',
            ancestorTitles: ['Suite name', 'Test name'],
            failureMessages: 'error message',
          },
        ],
      };

      reporter.onTestResult(testObj, testResult);

      expect(spyStartStep).toHaveBeenCalledWith(testResult.testResults[0], false, testObj.path);
      expect(spyFinishStep).toHaveBeenCalledWith(testResult.testResults[0], false);
    });

    test('startTest should not be called if there are no tests', () => {
      const spyStartTest = jest.spyOn(reporter, '_startTest');
      const testResult = {
        testResults: [
          {
            title: 'Title',
            status: 'failed',
            ancestorTitles: ['Suite name'],
            failureMessages: 'error message',
          },
        ],
      };

      reporter.onTestResult(testObj, testResult);

      expect(spyStartTest).not.toHaveBeenCalled();
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
    test('startTestItem should be called with parameters if tempSuiteIds doesn\'t contain this suite,'
            + 'tempSuiteId should be defined', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const expectedStartTestItemParameter = {
        type: 'SUITE',
        name: 'suite name',
        codeRef: 'example.js/suite name',
        startTime: new Date().valueOf() - duration,
      };
      const expectedTempSuiteIds = new Map([['suite name', 'startTestItem']]);
      reporter.tempLaunchId = 'tempLaunchId';

      reporter._startSuite('suite name', testObj.path, duration);

      expect(reporter.client.startTestItem).toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId');
      expect(reporter.tempSuiteIds).toEqual(expectedTempSuiteIds);
    });

    test('startTestItem should not be called with parameters if tempSuiteIds contains this suite', () => {
      reporter.tempSuiteIds = new Map([['suite name', 'startTestItem']]);

      reporter._startSuite('suite name', testObj.path);

      expect(reporter.client.startTestItem).not.toHaveBeenCalled();
    });
  });

  describe('_startTest', () => {
    test('startTestItem should be called with parameters if tempTestIds doesn\'t contain this suite,'
            + 'tempSuiteId should be defined', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const expectedStartTestItemParameter = {
        type: 'TEST',
        name: 'Test name',
        codeRef: 'example.js/Suite name/Test name',
        startTime: new Date().valueOf() - duration,
      };
      const expectedTempTestIds = new Map([['Suite name/Test name', 'startTestItem']]);
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.tempSuiteIds = new Map([['Suite name', 'suiteId']]);

      reporter._startTest({ ancestorTitles: ['Suite name', 'Test name'] }, testObj.path, duration);

      expect(reporter.client.startTestItem)
        .toHaveBeenCalledWith(expectedStartTestItemParameter, 'tempLaunchId', 'suiteId');
      expect(reporter.tempTestIds).toEqual(expectedTempTestIds);
    });

    test('startTestItem should not be called with parameters if tempTestIds contains this test', () => {
      reporter.tempTestIds = new Map([['Suite name/Test name', 'startTestItem']]);

      reporter._startTest({ ancestorTitles: ['Suite name', 'Test name'] }, testObj.path);

      expect(reporter.client.startTestItem).not.toHaveBeenCalled();
    });
  });

  describe('_startStep', () => {
    test('startTestItem should be called with parameters with tempTestId, tempStepId should be defined', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const expectedStartStepItemParameter = {
        type: 'STEP',
        name: 'Step',
        codeRef: 'example.js/Suite/Test/Step',
        retry: true,
        startTime: new Date().valueOf() - duration,
      };
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.tempTestIds = new Map([['Suite/Test', 'tempTestId']]);

      reporter._startStep({ title: 'Step', ancestorTitles: ['Suite', 'Test'], duration }, true, testObj.path);

      expect(reporter.client.startTestItem)
        .toHaveBeenCalledWith(expectedStartStepItemParameter, 'tempLaunchId', 'tempTestId');
      expect(reporter.tempStepId).toEqual('startTestItem');
    });

    test('startTestItem should be called with parameters with tempSuiteId, tempStepId should be defined', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const expectedStartStepItemParameter = {
        type: 'STEP',
        name: 'Step',
        codeRef: 'example.js/Suite/Step',
        retry: true,
        startTime: new Date().valueOf() - duration,
      };
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.tempSuiteIds = new Map([['Suite', 'tempSuiteId']]);

      reporter._startStep({ title: 'Step', ancestorTitles: ['Suite'], duration }, true, testObj.path);

      expect(reporter.client.startTestItem)
        .toHaveBeenCalledWith(expectedStartStepItemParameter, 'tempLaunchId', 'tempSuiteId');
      expect(reporter.tempStepId).toEqual('startTestItem');
    });
  });

  describe('_sendLog', () => {
    test('sendLog should be called with parameters', () => {
      const expectedLogObjectParameter = {
        message: 'message',
        level: 'error',
      };
      reporter.tempStepId = 'tempStepId';

      reporter._sendLog('message');

      expect(reporter.client.sendLog).toHaveBeenCalledWith('tempStepId', expectedLogObjectParameter);
    });
  });

  describe('_finishStep', () => {
    test('_finishPassedTest should be called if step status is passed', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter._finishStep({ status: testItemStatuses.PASSED, failureMessages: [] });

      expect(spyFinishPassedTest).toHaveBeenCalled();
      expect(spyFinishFailedTest).not.toHaveBeenCalled();
      expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishFailedStep should be called with error message if step status is failed', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter._finishStep(
        { status: testItemStatuses.FAILED, failureMessages: ['error message'] },
        false,
      );

      expect(spyFinishFailedTest).toHaveBeenCalledWith('error message', false);
      expect(spyFinishPassedTest).not.toHaveBeenCalled();
      expect(spyFinishSkippedTest).not.toHaveBeenCalled();
    });

    test('_finishPassedStep should be called if step status is skipped or any other', () => {
      const spyFinishPassedTest = jest.spyOn(reporter, '_finishPassedStep');
      const spyFinishFailedTest = jest.spyOn(reporter, '_finishFailedStep');
      const spyFinishSkippedTest = jest.spyOn(reporter, '_finishSkippedStep');

      reporter._finishStep({ status: testItemStatuses.SKIPPED, failureMessages: [] });

      expect(spyFinishSkippedTest).toHaveBeenCalled();
      expect(spyFinishPassedTest).not.toHaveBeenCalled();
      expect(spyFinishFailedTest).not.toHaveBeenCalled();
    });
  });

  describe('_finishTest', () => {
    test('finishTestItem should be called with parameters, tempTestId should be deleted', () => {
      reporter.tempTestIds = new Map([['Test', 'tempTestId']]);

      reporter._finishTest('tempTestId', 'Test');

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempTestId', {});
      expect(reporter.tempTestIds.get('Test')).toEqual(undefined);
    });

    test('finishTestItem should not be called with parameters if there is no tempTestId', () => {
      reporter._finishTest(undefined);

      expect(reporter.client.finishTestItem).not.toHaveBeenCalled();
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
        retry: false,
      };
      reporter.tempStepId = 'tempStepId';

      reporter._finishPassedStep(false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempStepId', expectedFinishTestItemParameter);
    });
  });

  describe('_finishFailedStep', () => {
    test('_sendLog should be called with failure message, finishTestItem should be called with parameters', () => {
      const spySendLog = jest.spyOn(reporter, '_sendLog');
      const expectedFinishTestItemParameter = {
        status: 'failed',
        retry: false,
      };
      reporter.tempStepId = 'tempStepId';

      reporter._finishFailedStep('error message', false);

      expect(spySendLog).toHaveBeenCalledWith('error message');
      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempStepId', expectedFinishTestItemParameter);
    });
  });

  describe('_finishSkippedStep', () => {
    test('finishTestItem should be called with parameters', () => {
      const expectedFinishTestItemParameter = {
        status: 'skipped',
        retry: false,
      };
      reporter.tempStepId = 'tempStepId';

      reporter._finishSkippedStep(false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempStepId', expectedFinishTestItemParameter);
    });

    test('finishTestItem should be called with issue parameter if skippedIssue is false', () => {
      const expectedFinishTestItemParameter = {
        status: 'skipped',
        retry: false,
        issue: { issueType: 'NOT_ISSUE' },
      };
      reporter.tempStepId = 'tempStepId';
      reporter.reportOptions.skippedIssue = false;

      reporter._finishSkippedStep(false);

      expect(reporter.client.finishTestItem).toHaveBeenCalledWith('tempStepId', expectedFinishTestItemParameter);
    });
  });
});
