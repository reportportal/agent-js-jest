/* eslint-disable no-process-env */
const entityType = { SUITE: 'SUITE', TEST: 'STEP' },

    getStartLaunchObject = (options = {}) => ({
        launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
        attributes: options.attributes,
        startTime: new Date().valueOf()
    }),

    getTestStartObject = testTitle => ({
        type: entityType.TEST,
        name: testTitle || 'Custom Test title'
    }),

    getSuiteStartObject = suiteName => ({
        type: entityType.SUITE,
        name: suiteName || 'Title Custom',
        startTime: new Date().valueOf()
    }),

    getClientInitObject = (options = {}) => {
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
            launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
            project: process.env.RP_PROJECT_NAME || options.project,
            attributes: env_attributes || options.attributes
        };
    };

module.exports = {
    getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject
};
