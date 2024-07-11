# @reportportal/agent-js-jest

Agent to integrate Jest with ReportPortal.
* More about [Jest](https://jestjs.io/)
* More about [ReportPortal](http://reportportal.io/)

## Installation

```shell
npm install --save-dev @reportportal/agent-js-jest
```

## Configuration

**1.** Create `jest.config.js` file with reportportal configuration:
```javascript
module.exports = {
    testRunner: 'jest-circus/runner',
    testRegex: ['/__tests__/.*.spec.js?$'],
    reporters: [
        'default',
        [
            '@reportportal/agent-js-jest',
            {
                apiKey: 'reportportalApiKey',
                endpoint: 'https://your.reportportal.server/api/v1',
                project: 'Your reportportal project name',
                launch: 'Your launch name',
                attributes: [
                    {
                        key: 'key',
                        value: 'value',
                    },
                    {
                        value: 'value',
                    },
                ],
                description: 'Your launch description',
            }
        ]
    ],
    ...
};
```

In case you use the jest config section of `package.json`, add the following entry:

```JSON
{
    "jest": {
        ...
        "reporters": [
            "default",
            ["@reportportal/agent-js-jest",
            {
                "token": "reportportalApiKey",
                "endpoint": "https://your.reportportal.server/api/v1",
                "project": "Your reportportal project name",
                "launch": "Your launch name",
                "attributes": [
                    {
                        "key": "key",
                        "value": "value"
                    },
                    {
                        "value": "value"
                    }
                ],
                "description": "Your launch description"
            }]
        ],
        ...
    }
}
```

The full list of available options presented below.

| Option                             | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                              |
|------------------------------------|------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey                             | Required   |           | User's reportportal token from which you want to send requests. It can be found on the profile page of this user.                                                                                                                                                                                                                                                                        |
| endpoint                           | Required   |           | URL of your server. For example 'https://server:8080/api/v1'. Use `api/v2` for asynchronous reporting.                                                                                                                                                                                                                                                                                                                            |
| launch                             | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                              |
| project                            | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                           |
| attributes                         | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                       |
| description                        | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                      |
| rerun                              | Optional   | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                             |
| rerunOf                            | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name. Works only if `rerun` set to `true`.                                                                                                                                                                                                                                                                         |
| mode                               | Optional   | 'DEFAULT' | Results will be submitted to Launches page <br/> *'DEBUG'* - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                    |
| skippedIssue                       | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                  |
| debug                              | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                         |
| launchId                           | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN_PROGRESS' status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                        |
| restClientConfig                   | Optional   | Not set   | The object with `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, may contain other client options eg. [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| isLaunchMergeRequired              | Optional   | false     | This flag determines whether to create temp files with the UUIDs of started launches and allow them to be merged using [`client-javascript`'s `mergeLaunches` method](https://github.com/reportportal/client-javascript#mergelaunches). Temp file format: `rplaunch-${launch_uuid}.tmp`.                                                                                                 |
| launchUuidPrint                    | Optional   | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                |
| launchUuidPrintOutput              | Optional   | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR'. Works only if `launchUuidPrint` set to `true`.                                                                                                                                                                                                                                                                         |
| extendTestDescriptionWithLastError | Optional   | true      | If set to `true` the latest error log will be attached to the test case description.                                                                                                                                                                                                                                                                                                     |
| token                              | Deprecated | Not set   | Use `apiKey` instead.                                                                                                                                                                                                                                                                                                                                                                    |

The following options can be overridden using ENVIRONMENT variables:

| Option      | ENV variable    | Note                                   |
|-------------|-----------------|----------------------------------------|
| apiKey      | RP_API_KEY      ||
| project     | RP_PROJECT_NAME ||
| endpoint    | RP_ENDPOINT     ||
| launch      | RP_LAUNCH       |                                        |
| attributes  | RP_ATTRIBUTES   | *Format:* key:value,key:value,value    |
| description | RP_DESCRIPTION  ||
| launchId    | RP_LAUNCH_ID    |                                        |
| mode        | RP_MODE         ||
| token       | RP_TOKEN        | *deprecated* Use `RP_API_KEY` instead. |

This is for your convenience if you have a continuous job that runs your tests and may report results that point to a different reportportal project definition, launch name, or attributes.

**2.** Add script to `package.json` file:
```json
{
  "scripts": {
    "test": "jest --no-colors --detectOpenHandles --config ./jest.config.js"
  }
}
```

## Features

### Retries

The agent has support of retries.
Read more about [retries in jest](https://jestjs.io/ru/docs/jest-object#jestretrytimesnumretries-options).

## Reporting API

This reporter provides `ReportingApi` in global variables to use it directly in tests to send some additional data to the report.

*Note:* `ReportingApi` does not support tests running in [`concurrent` mode](https://jestjs.io/docs/api#testconcurrentname-fn-timeout) at the moment.

### Reporting API methods

#### attachment
Send file to ReportPortal for the current test. Should be called inside of corresponding test.<br/>
`ReportingApi.attachment(file: {name: string; type: string; content: string | Buffer;}, description?: string);`<br/>
**required**: `file`<br/>
**optional**: `description`<br/>
Example:
```javascript
test('should be passed with attachment', () => {
    const fileName = 'test.png';
    const fileContent = fs.readFileSync(path.resolve(__dirname, './attachments', fileName));

    ReportingApi.attachment({
        name: fileName,
        type: 'image/png',
        content: fileContent.toString('base64'),
    }, 'Description');

    expect(true).toBe(true);
});
```

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

This code was based on the [jest-junit](https://github.com/jest-community/jest-junit)
and adapted by team members of [Ontoforce](https://www.ontoforce.com) for the
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
