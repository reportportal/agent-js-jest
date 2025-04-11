const path = require('path');
const { TEST_ITEM_STATUSES } = require('../../src/constants');

const mockDate = 1712900000000;
const duration = 5;
const testFilePath = `C:${path.sep}testProject${path.sep}example.js`;
const failedTestResult = {
  title: 'failed title',
  status: TEST_ITEM_STATUSES.FAILED,
  ancestorTitles: ['Failed suite name', 'Failed test name'],
  failureMessages: ['error message'],
  invocations: 1,
  startedAt: mockDate,
};
const skippedTestResult = {
  title: 'skipped title',
  status: TEST_ITEM_STATUSES.SKIPPED,
  ancestorTitles: ['Skipped suite name', 'Skipped test name'],
  failureMessages: [],
};
const testResult = {
  testResults: [failedTestResult],
  testFilePath,
};
const testResultWithSkipped = {
  testResults: [failedTestResult, skippedTestResult],
  testFilePath,
};
const testObj = {
  path: testFilePath,
};
const mockFile = { name: 'test_img_name', type: 'image/png', content: 'content' };

module.exports = {
  mockDate,
  duration,
  failedTestResult,
  skippedTestResult,
  testResult,
  testResultWithSkipped,
  testObj,
  mockFile,
  testFilePath,
};
