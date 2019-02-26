const getOptions = require('reportportal-agent-jest/utils/getOptions');
const RPClient = require('reportportal-client');

const entityType = { SUITE: 'SUITE', TEST: 'STEP' };
const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'skipped' };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _load_base_reporter() {
  return _base_reporter = _interopRequireDefault(require('../jest/node_modules/jest-cli/build/reporters/base_reporter'));
}

function _load_Status() {
  return _Status = _interopRequireDefault(require('../jest/node_modules/jest-cli/build/reporters/Status'));
}


const promiseErrorHandler = (promise) => {
  promise.catch(err => {
    console.error(err);
  });
};

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
    name: process.env.RP_LAUNCH_NAME || options.launchname || 'Unit Tests',
    tags: options.tags,
    start_time: new Date().valueOf(),
  }
}

const getTestStartObject = (testTitle) => {
  return { 
    type: entityType.TEST, 
    name: testTitle  || "Custom Test title"
  };
}

const getSuiteStartObject = (suiteTitle) => {
  return { type: entityType.SUITE, name: suiteTitle || "Title Custom" };
}


class JestReportPortal  extends _load_base_reporter().default {
  constructor(globalConfig, options) {
    super();
    
    this.globalConfig = globalConfig;
    this.reportOptions = getClientInitObject(getOptions.options(options));
    this.client = new RPClient(this.reportOptions);
    this.suiteId = 0;
    this.tempSuiteId = null;
    this.tempTestId = null;

    let startLaunchObj = getStartLaunchObject(this.reportOptions)
    const { tempId, promise } = this.client.startLaunch(startLaunchObj)
    console.log(`Launch id: ${tempId}`)
    this.tempLaunchId = tempId;
    promiseErrorHandler(promise)

  }

  onRunStart(aggregatedResults, options) {
    this.suiteId += 1;
    let suiteTitle = `Suite title ${this.suiteId}`

    const { tempId, suitePromise } = this.client.startTestItem({
      "type" : entityType.SUITE,
      "name": suiteTitle,
      "start_time": this.client.helpers.now()
    }, this.tempLaunchId);

    this.tempSuiteId = tempId;
    console.log(`Suite id: ${suitePromise}`)
  }

  onTestStart(test) {
    console.log(test.path)

    const testStartObj = getTestStartObject(test.context.config.name)
    
    const {tempId} = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      this.tempSuiteId
    );

    this.tempTestId = tempId;
    console.log(`Test id: ${tempId}`)
  }

  onTestResult(test, testResult, aggregatedResults) {
    
    if (testResult.testResults[0].status === 'passed'){
      let suiteId = this.tempSuiteId;
      let status = testItemStatuses.PASSED;
      let finishTestObj = { status , suiteId};

      const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);
      promiseErrorHandler(promise);
    }

    if (testResult.testResults[0].status === 'failed'){
      let message = `Stacktrace: ${testResult.failureMessage}\n`;
      let finishTestObj = { 
        status: testItemStatuses.FAILED, 
        description: message 
      };

      const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);
      promiseErrorHandler(promise);
    }
  }

  onRunComplete(contexts, results) {
    this.client.finishTestItem(this.tempSuiteId, {});
    this.client.finishLaunch(this.tempLaunchId);
  };
}

module.exports = JestReportPortal;
