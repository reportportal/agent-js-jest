const getOptions = require('./utils/getOptions'),
    RPClient = require('reportportal-client-restler'),
    base_reporter = require('jest-reporters/lib/BaseReporter'),
    { getClientInitObject, getSuiteStartObject,
        getStartLaunchObject, getTestStartObject } = require('./utils/objectUtils');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' },

    logLevels = {
        ERROR: 'error',
        TRACE: 'trace',
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn'
    },


    promiseErrorHandler = promise => {
        promise.catch(err => {
            console.error(err);
        });
    };


class JestReportPortal extends base_reporter {
    constructor (globalConfig, options) {
        super();
        this.globalConfig = globalConfig;
        this.reportOptions = getClientInitObject(getOptions.options(options));
        this.client = new RPClient(this.reportOptions);
        this.tempSuiteIds = [];
        this.ancestorTree = {};
        this.openedTempSuits = [];
        this.isCleanupNeeded = false;
        this.tempTestId = null;

    }


    // eslint-disable-next-line no-unused-vars
    onRunStart (aggregatedResults, options) {
        const startLaunchObj = getStartLaunchObject(this.reportOptions);
        let { tempId, promise } = this.client.startLaunch(startLaunchObj);

        this.tempLaunchId = tempId;
        promiseErrorHandler(promise);
    }

    // делаем структуру по типу
    // {
    //     arr: null,
    //     prop: {
    //         arr: [1,2]
    //         prop: {
    //             arr[3,4]
    //         }
    //     }
    // }
    createTree(ancestorTitles,ancestorTree){
        ancestorTitles.some((ancestor, i, arr)=>{
            if(!ancestorTree[ancestor] && arr.length !== 1) {
                ancestorTree[ancestor] = {
                    arr: null
                };
            } 

            if(arr.length === 1) {
                ancestorTree[ancestor] || (ancestorTree[ancestor] = {
                    arr: []
                });
                ancestorTree[ancestor].arr.push(this.tempTest)
                
                return true
            }
            this.createTree(arr.slice(1), ancestorTree[ancestor])
            return true
        }) 
    }

    getLastSuiteId() {
        return this.tempSuiteIds[this.tempSuiteIds.length-1] && this.tempSuiteIds[this.tempSuiteIds.length-1][1]
    }

     manageSuitsAndTests(tree)  {
         //проходимся по построенному дереву
        Object.keys(tree).forEach((suitName,i,arr) => {
            // если в объекте кроме массива есть еще пропы
            // скипаем иттерацию по свойству arr
            if(suitName === 'arr' && arr.length > 1) {
                return 
            }
            
            // когда в дереве дошли до конца, нужно закрыть все суиты этой ветки
            if(this.isCleanupNeeded) {
                this.tempSuiteIds.some((suiteAndId, index) => {
                    // нужно найти все суиты нужной ветки
                    // для этого есть массив массивов tempSuiteIds
                    // в них айдишник для апи и имя суита
                    // если имя суита это имя ветки которую нужно закрыть - закрываем
                    if(suiteAndId[0] === arr[i-1]) {
                        // вырезаем из этого массива массивов все суиты которые нужно закрыть
                        const suitesToFinish = this.tempSuiteIds.splice(index)

                        suitesToFinish.forEach(suite => {
                            this._finishSuite(suite[1])
                        })
                    }
                })

                this.isCleanupNeeded=false   
            }
            
            const { tempId, promise } = this.client.startTestItem(
                getSuiteStartObject(suitName),
                this.tempLaunchId, 
                this.getLastSuiteId()
            )

            this.tempSuiteIds.push([suitName, tempId])

            promiseErrorHandler(promise);


            if(tree[suitName].arr ) {
                tree[suitName].arr.forEach(t => {
                    this._startTest(t.title, tempId);
                    this._finishTest(t);
                });

                // если проп в ветке последний и у него только массив,
                // то закрываем суит вырезаем его и при след иттерации чистим ветку
                if(Object.keys(tree[suitName]).length === 1) {
                    this.isCleanupNeeded = true;
                    this._finishSuite(tempId);

                    return this.tempSuiteIds.splice(-1)
                }
            } 
            
            //рекурсией по всему дереву
            return this.manageSuitsAndTests(tree[suitName])
        })
      }

    // eslint-disable-next-line no-unused-vars
    onTestResult (test, testResult, aggregatedResults) {
        testResult.testResults.forEach(test => {
            this.tempTest = test;

            this.createTree(test.ancestorTitles, this.ancestorTree)
        })

        this.manageSuitsAndTests(this.ancestorTree)

        // при завершении закрываем все суиты
        this.tempSuiteIds.forEach(suite => {
            this._finishSuite(suite[1])
        })
        // обнуляем дерево и суиты
        this.tempSuiteIds=[]
        this.ancestorTree={}
    }

    // eslint-disable-next-line no-unused-vars
    onRunComplete (contexts, results) {
        const { promise } = this.client.finishLaunch(this.tempLaunchId);

        promiseErrorHandler(promise);
    }

    _startSuite  (suiteName) {
        const { tempId, promise } = this.client.startTestItem(getSuiteStartObject(suiteName),
            this.tempLaunchId, this.getLastSuiteId());
            

        promiseErrorHandler(promise);
        this.tempSuiteIds[suiteName]=tempId;
    }

    _startTest (testName, tempSuiteId) {
        const testStartObj = getTestStartObject(testName),

            { tempId, promise } = this.client.startTestItem(testStartObj,
                this.tempLaunchId,
                tempSuiteId);

        promiseErrorHandler(promise);
        this.tempTestId = tempId;
    }

    _finishTest (test) {
        let errorMsg = test.failureMessages[0];

        switch (test.status) {
            case testItemStatuses.PASSED:
                this._finishPassedTest();
                break;
            case testItemStatuses.FAILED:
                this._finishFailedTest(errorMsg);
                break;
            case testItemStatuses.SKIPPED:
                this._finishSkippedTest();
                break;
            default:
                // eslint-disable-next-line no-console
                console.log('Unsupported test Status!!!');
        }
    }

    _finishPassedTest () {
        let status = testItemStatuses.PASSED,
            finishTestObj = { status };

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishFailedTest (failureMessage) {
        let message = `Stacktrace: ${failureMessage}\n`,
            finishTestObj = {
                status: testItemStatuses.FAILED,
                description: message
            };

        this._sendLog(message);

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _sendLog (message) {
        let logObject = {
            message: message,
            level: logLevels.ERROR
        };
        const { promise } = this.client.sendLog(this.tempTestId, logObject);

        promiseErrorHandler(promise);
    }

    _finishSkippedTest () {
        let finishTestObj = {
            status: 'skipped',
            issue: { issue_type: 'NOT_ISSUE' }
        };

        const { promise } = this.client.finishTestItem(this.tempTestId, finishTestObj);

        promiseErrorHandler(promise);
    }

    _finishSuite (id) {
        const { promise } = this.client.finishTestItem(id, {});

        promiseErrorHandler(promise);
    }
}

module.exports = JestReportPortal;