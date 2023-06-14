# @reportportal/agent-js-jest

Agent to integrate Jest with ReportPortal.
* More about [Jest](https://jestjs.io/)
* More about [ReportPortal](http://reportportal.io/)

## Installation

```shell
npm install --save-dev @reportportal/agent-js-jest
```

## Configuration

**1.** Create `jest.config.js` (alternatively update the jest config section of `package.json`) file with reportportal configuration:
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
                project: 'Your project',
                launch: 'Jest test',
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
};
```

| Option           | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                              |
|------------------|------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey           | Required   |           | User's reportportal token from which you want to send requests. It can be found on the profile page of this user.                                                                                                                                                                                                                                                                        |
| endpoint         | Required   |           | URL of your server. For example 'https://server:8080/api/v1'.                                                                                                                                                                                                                                                                                                                            |
| launch           | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                              |
| project          | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                           |
| attributes       | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                       |
| description      | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                      |
| rerun            | Optional   | false     | Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)                                                                                                                                                                                                                                                                                  |
| rerunOf          | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name                                                                                                                                                                                                                                                                        |
| mode             | Optional   | 'DEFAULT' | Results will be submitting to Launches page <br/> *"DEBUG"* - Results will be submitting to Debug page.                                                                                                                                                                                                                                                                                  |
| skippedIssue     | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                  |
| debug            | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                         |
| launchId         | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in "IN_PROGRESS status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                         |
| logLaunchLink    | Optional   | false     | This flag allows print the URL of the Launch of the tests in console.                                                                                                                                         |
| restClientConfig | Optional   | Not set   | The object with `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, may contain other client options eg. [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| token            | Deprecated | Not set   | Use `apiKey` instead.                                                                                                                                                                                                                                                                                                                                                                    |

The following options can be overridden using ENVIRONMENT variables:

| Option   | ENV variable    | Note                                |
|-------------|-----------------|-------------------------------------|
| apiKey      | RP_API_KEY      ||
| project     | RP_PROJECT_NAME ||
| endpoint    | RP_ENDPOINT     ||
| launch      | RP_LAUNCH       |                                     |
| attributes  | RP_ATTRIBUTES   | *Format:* key:value,key:value,value |
| description | RP_DESCRIPTION  ||
| launchId    | RP_LAUNCH_ID    |                                     |
| mode        | RP_MODE         ||
| token       | RP_TOKEN        | *deprecated*                        |

This for your convenience in case you have a continuous job that run your tests and may post the results pointing to a different reportportal definition of project, launcher name or attributes.

**2.** Add script to `package.json` file:
```json
{
  "scripts": {
    "test": "npx playwright test --config=playwright.config.ts"
  }
}
```

## Features

### Retries

The agent has support of retries.
Read more about [retries in jest](https://jestjs.io/ru/docs/jest-object#jestretrytimesnumretries-options).

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

This code was based on the [jest-junit](https://github.com/jest-community/jest-junit)
and adapted by team members of [Ontoforce](https://www.ontoforce.com) for the
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
