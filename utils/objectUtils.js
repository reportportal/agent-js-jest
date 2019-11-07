/* eslint-disable no-process-env */
const entityType = { SUITE: 'SUITE', TEST: 'STEP' },

    getStartLaunchObject = (options = {}) => ({
        launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
        tags: options.tags,
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
        let env_tags = process.env.RP_TAGS === undefined ? undefined : process.env.RP_TAGS.split(',');

        return {
            token: process.env.RP_TOKEN,
            endpoint: options.endpoint,
            launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
            project: process.env.RP_PROJECT_NAME || options.project,
            tags: env_tags || options.tags || 'tag1, tag2'
        };
    };

module.exports = {
    getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject
};
