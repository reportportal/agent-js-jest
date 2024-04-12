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
const {
  getAgentOptions,
  getStartLaunchObject,
  getSuiteStartObject,
  getTestStartObject,
  getStepStartObject,
  getAgentInfo,
  getCodeRef,
  getFullTestName,
  getFullStepName,
  getSystemAttributes,
} = require('../src/utils/objectUtils');
const pjson = require('../package.json');

const defaultOptions = {
  launch: 'launchName',
  description: 'description',
  attributes: [
    {
      key: 'YourKey',
      value: 'YourValue',
    },
    {
      value: 'YourValue',
    },
  ],
  rerun: true,
  rerunOf: '00000000-0000-0000-0000-000000000000',
};
const currentDate = new Date();
const RealDate = Date;
const duration = 5;

describe('Object Utils script', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    global.Date = jest.fn((...args) =>
      args.length ? new RealDate(...args) : new RealDate(currentDate),
    );
    Object.assign(Date, RealDate);

    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.Date = RealDate;
    process.env = OLD_ENV;
  });

  describe('getStartLaunchObject', () => {
    test('should return start launch object with correct values', () => {
      const expectedStartLaunchObject = {
        description: 'description',
        attributes: [
          {
            key: 'YourKey',
            value: 'YourValue',
          },
          {
            value: 'YourValue',
          },
          {
            key: 'agent',
            value: `${pjson.name}|${pjson.version}`,
            system: true,
          },
        ],
        rerun: true,
        rerunOf: '00000000-0000-0000-0000-000000000000',
        startTime: new Date().valueOf(),
      };

      const startLaunchObject = getStartLaunchObject(defaultOptions);

      expect(startLaunchObject).toBeDefined();
      expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });

    test("should return start launch object with default values if options don't set", () => {
      const expectedStartLaunchObject = {
        attributes: [
          {
            key: 'agent',
            value: `${pjson.name}|${pjson.version}`,
            system: true,
          },
        ],
        startTime: new Date().valueOf(),
      };

      const startLaunchObject = getStartLaunchObject();

      expect(startLaunchObject).toBeDefined();
      expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });
  });

  describe('getStepStartObject', () => {
    test('should return step start object with correct values', () => {
      const expectedStepStartObject = {
        type: 'STEP',
        name: 'step title',
        retry: true,
        startTime: new Date().valueOf() - duration,
      };

      const stepStartObject = getStepStartObject('step title', true, undefined, duration);

      expect(stepStartObject).toBeDefined();
      expect(stepStartObject).toEqual(expectedStepStartObject);
    });
  });

  describe('getTestStartObject', () => {
    test('should return test start object with correct values', () => {
      const expectedTestStartObject = {
        type: 'TEST',
        name: 'test title',
        startTime: new Date().valueOf() - duration,
      };

      const testStartObject = getTestStartObject('test title', undefined, duration);

      expect(testStartObject).toBeDefined();
      expect(testStartObject).toEqual(expectedTestStartObject);
    });
  });

  describe('getSuiteStartObject', () => {
    test('should return suite start object with correct values', () => {
      const expectedSuiteStartObject = {
        type: 'SUITE',
        name: 'suite name',
        startTime: new Date().valueOf() - duration,
      };

      const suiteStartObject = getSuiteStartObject('suite name', undefined, duration);

      expect(suiteStartObject).toBeDefined();
      expect(suiteStartObject).toEqual(expectedSuiteStartObject);
    });
  });

  describe('getAgentOptions', () => {
    test(
      'should return agent options object with correct values, some parameters taken from' +
        ' environment variables',
      () => {
        process.env = {
          RP_API_KEY: '123',
          RP_LAUNCH: 'launch name',
          RP_PROJECT_NAME: 'project name',
          RP_ATTRIBUTES: 'attributesOne,attributesTwoKey:attributesTwoValue',
        };
        const expectedAgentOptions = {
          apiKey: '123',
          endpoint: 'endpoint',
          launch: 'launch name',
          project: 'project name',
          rerun: true,
          rerunOf: '00000000-0000-0000-0000-000000000000',
          description: 'description',
          attributes: [
            { key: null, value: 'attributesOne' },
            { key: 'attributesTwoKey', value: 'attributesTwoValue' },
          ],
          mode: 'DEBUG',
          debug: true,
        };
        const options = {
          endpoint: 'endpoint',
          rerun: true,
          rerunOf: '00000000-0000-0000-0000-000000000000',
          description: 'description',
          mode: 'DEBUG',
          debug: true,
        };

        const agentOptions = getAgentOptions(options);

        expect(agentOptions).toBeDefined();
        expect(agentOptions).toEqual(expectedAgentOptions);
      },
    );

    test("should return agent options object with default values if options don't set", () => {
      const expectedClientInitObject = {};

      const clientInitObject = getAgentOptions();

      expect(clientInitObject).toBeDefined();
      expect(clientInitObject).toEqual(expectedClientInitObject);
    });
  });

  describe('getAgentInfo', () => {
    test('should return the name and version of application from package.json file', () => {
      const agentInfo = getAgentInfo();

      expect(agentInfo.name).toBe(pjson.name);
      expect(agentInfo.version).toBe(pjson.version);
    });
  });

  describe('getSystemAttributes', () => {
    test('should return only agent system attribute if parameter is true', () => {
      const expectedSystemAttribute = [
        {
          key: 'agent',
          value: `${pjson.name}|${pjson.version}`,
          system: true,
        },
      ];

      const systemAttributes = getSystemAttributes(true);

      expect(systemAttributes).toEqual(expectedSystemAttribute);
    });

    test('should return only agent system attribute if there is no parameter', () => {
      const expectedSystemAttribute = [
        {
          key: 'agent',
          value: `${pjson.name}|${pjson.version}`,
          system: true,
        },
      ];

      const systemAttributes = getSystemAttributes();

      expect(systemAttributes).toEqual(expectedSystemAttribute);
    });

    test('should return agent and skippedIssue system attributes if parameter is false', () => {
      const expectedSystemAttribute = [
        {
          key: 'agent',
          value: `${pjson.name}|${pjson.version}`,
          system: true,
        },
        {
          key: 'skippedIssue',
          value: 'false',
          system: true,
        },
      ];

      const systemAttributes = getSystemAttributes(false);

      expect(systemAttributes).toEqual(expectedSystemAttribute);
    });
  });

  describe('getCodeRef', () => {
    test('should return correct code ref with separator', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const mockedTest = {
        title: 'testTitle',
        filePath: `C:${path.sep}testProject${path.sep}test${path.sep}example.js`,
      };
      const expectedCodeRef = 'test/example.js/testTitle';

      const codeRef = getCodeRef(mockedTest.filePath, mockedTest.title);

      expect(codeRef).toEqual(expectedCodeRef);
    });

    test('should return correct code ref without separator', () => {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const mockedTest = {
        title: 'testTitle',
        filePath: `C:${path.sep}testProject${path.sep}example.js`,
      };
      const expectedCodeRef = 'example.js/testTitle';

      const codeRef = getCodeRef(mockedTest.filePath, mockedTest.title);

      expect(codeRef).toEqual(expectedCodeRef);
    });
  });

  describe('getFullTestName', () => {
    test('should return correct full test name', () => {
      const mockedTest = {
        ancestorTitles: ['rootDescribe', 'parentDescribe', 'testTitle'],
      };
      const expectedFullTestName = 'rootDescribe/parentDescribe/testTitle';

      const fullTestName = getFullTestName(mockedTest);

      expect(fullTestName).toEqual(expectedFullTestName);
    });
  });

  describe('getFullStepName', () => {
    test('should return correct full step name', () => {
      const mockedTest = {
        title: 'stepTitle',
        ancestorTitles: ['rootDescribe', 'parentDescribe'],
      };
      const expectedFullStepName = 'rootDescribe/parentDescribe/stepTitle';

      const fullStepName = getFullStepName(mockedTest);

      expect(fullStepName).toEqual(expectedFullStepName);
    });
  });
});
