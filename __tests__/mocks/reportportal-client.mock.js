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

const { mockDate } = require('./data');

const reporterOptions = {
  apiKey: '00000000-0000-0000-0000-000000000000',
  endpoint: 'endpoint',
  project: 'projectName',
  launch: 'launcherName',
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
};

class RPClient {
  constructor() {
    this.startLaunch = this.mockStartLaunch();
    this.finishLaunch = this.mockFinishLaunch();
    this.startTestItem = this.mockStartTestItem();
    this.finishTestItem = this.mockFinishTestItem();
    this.sendLog = this.mockSendLog();
    this.helpers = {
      now: jest.fn().mockReturnValue(mockDate),
    };
  }

  mockStartLaunch() {
    return jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'startLaunch',
    });
  }

  mockFinishLaunch() {
    return jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'finishLaunch',
    });
  }

  mockStartTestItem() {
    return jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'startTestItem',
    });
  }

  mockFinishTestItem() {
    return jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'finishTestItem',
    });
  }

  mockSendLog() {
    return jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'sendLog',
    });
  }
}

module.exports = {
  getOptions: (options) => Object.assign(reporterOptions, options),
  RPClient,
};
