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

/* eslint-disable no-process-env */
const path = require('path');
const fs = require('fs');
const constants = require('../constants');

const getEnvOptions = () => {
  const options = {};

  for (const name in constants.ENVIRONMENT_CONFIG_MAP) {
    if (process.env[name]) {
      options[constants.ENVIRONMENT_CONFIG_MAP[name]] = process.env[name];
    }
  }

  return options;
};

const getAppOptions = (pathToResolve) => {
  let traversing = true;

  // Find nearest package.json by traversing up directories until /
  while (traversing) {
    traversing = pathToResolve !== path.sep;

    const pkgpath = path.join(pathToResolve, 'package.json');

    if (fs.existsSync(pkgpath)) {
      let options = (require(pkgpath) || {})['jest-junit'];

      if (Object.prototype.toString.call(options) !== '[object Object]') {
        options = {};
      }

      return options;
    }
    pathToResolve = path.dirname(pathToResolve);
  }

  return {};
};

module.exports = {
  options: (reporterOptions = {}) =>
    Object.assign(
      constants.DEFAULT_OPTIONS,
      reporterOptions,
      getAppOptions(process.cwd()),
      getEnvOptions(),
    ),
  getAppOptions,
  getEnvOptions,
};
