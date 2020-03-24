/* eslint-disable no-process-env */
const pjson = require('./../package.json');

const PJSON_VERSION = pjson.version;
const PJSON_NAME = pjson.name;
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };
const systemAttr = {
    key: 'agent',
    value: `${PJSON_NAME}|${PJSON_VERSION}`,
    system: true,
};

const getStartLaunchObject = (options = {}) => ({
    launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
    description: options.description,
    attributes: options.attributes ? [...options.attributes, systemAttr] : [systemAttr],
    rerun: options.rerun,
    rerunOf: options.rerunOf,
    startTime: new Date().valueOf()
});

const getTestStartObject = (testTitle, isRetried) => Object.assign(
    {
        type: entityType.TEST,
        name: testTitle
    }, { retry: isRetried });

const getSuiteStartObject = suiteName => ({
    type: entityType.SUITE,
    name: suiteName,
    startTime: new Date().valueOf()
});

const getClientInitObject = (options = {}) => {
    let env_attributes = process.env.RP_ATTRIBUTES === undefined ? undefined : process.env.RP_ATTRIBUTES.split(',').map(item => {
        const itemArr = item.split(':');

        return {
            'key': itemArr.length === 1 ? null : itemArr[0],
            'value': itemArr.length === 1 ? itemArr[0] : itemArr[1]
        };
    });

    return {
        token: process.env.RP_TOKEN || options.token,
        endpoint: process.env.RP_ENDPOINT || options.endpoint,
        launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
        project: process.env.RP_PROJECT_NAME || options.project,
        rerun: options.rerun,
        rerunOf: options.rerunOf,
        description: options.description,
        attributes: env_attributes || options.attributes,
    };
};

module.exports = {
    getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject
};
