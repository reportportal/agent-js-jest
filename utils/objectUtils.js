const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

const getClientInitObject = (options = {}) => {
    return {
      token: process.env.RP_TOKEN,
      endpoint: options.endpoint,
      launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
      project: process.env.RP_PROJECT_NAME || options.project
    }
  }
  
const getStartLaunchObject = (options = {}) => {
    return {
      launch: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
      tags: options.tags,
      start_time: new Date().valueOf()
    }
  }
  
const getTestStartObject = (testTitle) => {
    return { 
      type: entityType.TEST, 
      name: testTitle  || "Custom Test title"
    };
  }
  
const getSuiteStartObject = (suiteName) => {
    return {
      type: entityType.SUITE,
      name: suiteName || "Title Custom",
      start_time: new Date().valueOf()
    }
  }

module.exports = {
      getClientInitObject,
      getStartLaunchObject,
      getSuiteStartObject,
      getTestStartObject
  }