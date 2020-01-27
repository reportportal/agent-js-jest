/* eslint-disable no-process-env */
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

const getStartLaunchObject = (options = {}) => ({
    launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
    description: options.description,
    attributes: options.attributes,
    startTime: new Date().valueOf()
});

const getTestStartObject = testTitle => ({
    type: entityType.TEST,
    name: testTitle,
});

const getSuiteStartObject = suiteName => ({
    type: entityType.SUITE,
    name: suiteName,
    startTime: new Date().valueOf()
});

const getClientInitObject = (options = {}) => {
    let env_attributes = process.env.RP_ATTRIBUTES === undefined ? undefined : process.env.RP_ATTRIBUTES.split(',').map(item => {
        const itemArr = item.split(':');

        return {
            'key':  itemArr.length === 1 ? null : itemArr[0],
            'value': itemArr.length === 1 ? itemArr[0] : itemArr[1]
        };
    });

    return {
        token: process.env.RP_TOKEN || options.token,
        endpoint: options.endpoint,
        launch: process.env.RP_LAUNCH || options.launch || 'Unit Tests',
        project: process.env.RP_PROJECT_NAME || options.project,
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
