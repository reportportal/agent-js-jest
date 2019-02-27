const getOptions = require('reportportal-agent-jest/utils/getOptions');
const RPClient = require('reportportal-client');
const { load_base_reporter } = require('./utils/jest_utils')
const { getClientInitObject, getSuiteStartObject, getStartLaunchObject, getTestStartObject } = require('./utils/objectsUtils')

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };



const promiseErrorHandler = (promise) => {
  promise.catch(err => {
    console.error(err);
  });
};


class JestReportPortal  extends load_base_reporter().default {
  constructor(globalConfig, options) {
    super();
    
    this.globalConfig = globalConfig;
    this.reportOptions = getClientInitObject(getOptions.options(options));
    this.client = new RPClient(this.reportOptions);
    this.tempSuiteId = null;
    this.tempTestId = null;
  }

  onRunStart(aggregatedResults, options) {
    const startLaunchObj = getStartLaunchObject(this.reportOptions)
    let { tempId, promise } = this.client.startLaunch(startLaunchObj)

    this.tempLaunchId = tempId;
    promiseErrorHandler(promise)
  }

  onTestResult(test, testResult, aggregatedResults) {
    let suiteName = testResult.testResults[0].ancestorTitles[0]
    this._startSuite(suiteName)
    
    testResult.testResults.forEach(t => {
      this._startTest(t.title);
      this._finishTest(t)
    });

    this._finishSuite();
  }

  onRunComplete(contexts, results) {
    const { tempId, promise } = this.client.finishLaunch(this.tempLaunchId);
    promiseErrorHandler(promise);
  };

  _startSuite(suiteName) {
    const { tempId, promise } = this.client.startTestItem(
      getSuiteStartObject(suiteName), 
      this.tempLaunchId
    );
    
    promiseErrorHandler(promise)
    this.tempSuiteId = tempId;
  }

  _startTest(testName) {
    const testStartObj = getTestStartObject(testName)
    
    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      this.tempSuiteId
    );

    promiseErrorHandler(promise)
    this.tempTestId = tempId;
  }

  _finishTest(test) {
    console.log(test.status)
    switch(test.status) {
      case testItemStatuses.PASSED:
        this._finishPassedTest();
        break;
      case testItemStatuses.FAILED:
        this._finishFailedTest(test.failureMessage);
        break;
      case testItemStatuses.SKIPPED:
        this._finishSkippedTest();
        break;
      default:
        console.log('Unsupported test Status!!!')
    }
  }

  _finishPassedTest() {
    let suiteId = this.tempSuiteId;

    let status = testItemStatuses.PASSED;
    let finishTestObj = { 
      status: status
    };
  
    const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);
    promiseErrorHandler(promise);
  }

  _finishFailedTest(failureMessage) {
    let message = `Stacktrace: ${failureMessage}\n`;
    let finishTestObj = { 
      status: testItemStatuses.FAILED, 
      description: message 
    };

    const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);
    promiseErrorHandler(promise);
  }

  _finishSkippedTest() {
    let finishTestObj = { 
      status: 'skipped', 
      issue:  { issue_type: 'NOT_ISSUE' }
    };

    const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);
    promiseErrorHandler(promise); 
  }

  _finishSuite() {
    const { tempId, promise } = this.client.finishTestItem(this.tempSuiteId, {});
    promiseErrorHandler(promise);
  }
}

module.exports = JestReportPortal;
