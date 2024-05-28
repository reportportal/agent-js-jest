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

const path = require('path');

module.exports = {
  ENVIRONMENT_CONFIG_MAP: {
    JEST_SUITE_NAME: 'suiteName',
    JEST_JUNIT_OUTPUT: 'output',
    JEST_JUNIT_CLASSNAME: 'classNameTemplate',
    JEST_JUNIT_SUITE_NAME: 'suiteNameTemplate',
    JEST_JUNIT_TITLE: 'titleTemplate',
    JEST_JUNIT_ANCESTOR_SEPARATOR: 'ancestorSeparator',
    JEST_USE_PATH_FOR_SUITE_NAME: 'usePathForSuiteName',
  },
  DEFAULT_OPTIONS: {
    suiteName: 'jest tests',
    output: path.join(process.cwd(), './junit.xml'),
    classNameTemplate: '{classname} {title}',
    suiteNameTemplate: '{title}',
    titleTemplate: '{classname} {title}',
    ancestorSeparator: ' ',
    usePathForSuiteName: 'false',
  },
  CLASSNAME_VAR: 'classname',
  FILENAME_VAR: 'filename',
  FILEPATH_VAR: 'filepath',
  TITLE_VAR: 'title',
  DISPLAY_NAME_VAR: 'displayName',
  STEP_META_TYPE: {
    ATTACHMENT: 'attachment',
  },
  TEST_ITEM_STATUSES: { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' },
  LOG_LEVEL: {
    ERROR: 'error',
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
  },
};
