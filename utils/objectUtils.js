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
const pjson = require('./../package.json');

const PJSON_VERSION = pjson.version;
const PJSON_NAME = pjson.name;
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

const getStartLaunchObject = (options = {}) => {
    const systemAttr = getSystemAttributes(options.skippedIssue);

    return {
        launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
        description: options.description,
        attributes: options.attributes ? options.attributes.concat(systemAttr) : systemAttr,
        rerun: options.rerun,
        rerunOf: options.rerunOf,
        mode: options.mode,
        skippedIssue: options.skippedIssue,
        startTime: new Date().valueOf(),
    };
};

const getTestStartObject = (testTitle, isRetried, codeRef) => Object.assign(
    {
        type: entityType.TEST,
        name: testTitle,
        codeRef,
    }, { retry: isRetried },
);

const getSuiteStartObject = (suiteName, codeRef) => ({
    type: entityType.SUITE,
    name: suiteName,
    codeRef,
    startTime: new Date().valueOf(),
});

const getClientInitObject = (options = {}) => {
    const env_attributes = process.env.RP_ATTRIBUTES === undefined
        ? undefined
        : process.env.RP_ATTRIBUTES.split(',').map((item) => {
            const itemArr = item.split(':');

            return {
                key: itemArr.length === 1 ? null : itemArr[0],
                value: itemArr.length === 1 ? itemArr[0] : itemArr[1],
            };
        });

    return {
        token: process.env.RP_TOKEN || options.token,
        endpoint: options.endpoint,
        launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
        project: process.env.RP_PROJECT_NAME || options.project,
        rerun: options.rerun,
        rerunOf: options.rerunOf,
        skippedIssue: options.skippedIssue,
        description: options.description,
        attributes: env_attributes || options.attributes,
        mode: options.mode,
        debug: options.debug,
    };
};

const getAgentInfo = () => ({
    version: PJSON_VERSION,
    name: PJSON_NAME,
});

const getSystemAttributes = (skippedIssue) => {
    const systemAttr = [{
        key: 'agent',
        value: `${PJSON_NAME}|${PJSON_VERSION}`,
        system: true,
    }];

    if (skippedIssue === false) {
        const skippedIssueAttribute = {
            key: 'skippedIssue',
            value: 'false',
            system: true,
        };

        systemAttr.push(skippedIssueAttribute);
    }

    return systemAttr;
};

const getCodeRef = (testPath, title) => {
    const testFileDir = path
        .parse(path.normalize(path.relative(process.cwd(), testPath)))
        .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
    const separator = testFileDir ? '/' : '';
    const testFile = path.parse(testPath);

    return `${testFileDir}${separator}${testFile.base}/${title}`;
};

const getFullTestName = test => `${test.ancestorTitles.join('/')}/${test.title}`;

module.exports = {
    getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject,
    getAgentInfo,
    getCodeRef,
    getFullTestName,
    getSystemAttributes,
};
