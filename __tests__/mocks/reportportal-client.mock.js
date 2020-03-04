const reporterOptions = {
    token: '00000000-0000-0000-0000-000000000000',
    endpoint: 'endpoint',
    project: 'projectName',
    launch: 'launcherName',
    description: 'description',
    attributes: [
        {
            'key': 'YourKey',
            'value': 'YourValue'
        },
        {
            'value': 'YourValue'
        }
    ]
};

class RPClient {
    constructor() {
        this.startLaunch = this.mockStartLaunch();
        this.finishLaunch = this.mockFinishLaunch();
        this.startTestItem = this.mockStartTestItem();
        this.finishTestItem = this.mockFinishTestItem();
        this.sendLog = this.mockSendLog();
    }

    mockStartLaunch() {
        return jest.fn().mockReturnValue({
            promise: Promise.resolve('ok'),
            tempId: 'startLaunch',
        });
    }

    mockFinishLaunch() {
        return jest.fn().mockReturnValue( {
            promise: Promise.resolve('ok'),
            tempId: 'finishLaunch',
        });
    };

    mockStartTestItem() {
        return jest.fn().mockReturnValue({
            promise: Promise.resolve('ok'),
            tempId: 'startTestItem',
        });
    };

    mockFinishTestItem() {
        return jest.fn().mockReturnValue({
            promise: Promise.resolve('ok'),
            tempId: 'finishTestItem',
        });
    };

    mockSendLog() {
        return jest.fn().mockReturnValue({
            promise: Promise.resolve('ok'),
            tempId: 'sendLog',
        });
    };
}

module.exports = {
    getOptions: (options) => {
        return Object.assign(reporterOptions, options);
    },
    RPClient
};