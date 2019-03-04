/* eslint-disable no-process-env */
const entityType = { SUITE: 'SUITE', TEST: 'STEP' },

    getClientInitObject = (options = {}) => ({
        token: process.env.RP_TOKEN,
        endpoint: options.endpoint,
        launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
        project: process.env.RP_PROJECT_NAME || options.project,
        tags: process.env.RP_TAGS.split(',') || options.tags || 'tag1, tag2'
    }),

    getStartLaunchObject = (options = {}) => ({
        launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
        tags: options.tags,
        start_time: new Date().valueOf()
    }),

    getTestStartObject = testTitle => ({
        type: entityType.TEST,
        name: testTitle || 'Custom Test title'
    }),

    getSuiteStartObject = suiteName => ({
        type: entityType.SUITE,
        name: suiteName || 'Title Custom',
        start_time: new Date().valueOf()
    });

module.exports = {
    getClientInitObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject
};
