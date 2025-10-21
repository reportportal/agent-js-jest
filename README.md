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
                endpoint: 'https://your.reportportal.server/api/v2',
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
                "endpoint": "https://your.reportportal.server/api/v2",
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

### Authentication Options

The agent supports two authentication methods:
1. **API Key Authentication** (default)
2. **OAuth 2.0 Password Grant** (recommended for enhanced security)

**Note:**\
If both authentication methods are provided, OAuth 2.0 will be used.\
Either API key or complete OAuth 2.0 configuration is required to connect to ReportPortal.

| Option | Necessity   | Default | Description                                                                                                                                                    |
|--------|-------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey | Conditional |         | User's ReportPortal API key from which you want to send requests. It can be found on the profile page of this user. *Required only if OAuth is not configured. |
| oauth  | Conditional |         | OAuth 2.0 configuration object. When provided, OAuth authentication will be used instead of API key. See OAuth Configuration below.                            |

#### OAuth Configuration

The `oauth` object supports the following properties:

| Property              | Necessity  | Default  | Description                                                                                                                                                                                                                                                                                                                     |
|-----------------------|------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| tokenEndpoint         | Required   |          | OAuth 2.0 token endpoint URL for password grant flow.                                                                                                                                                                                                                                                                           |
| username              | Required   |          | Username for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| password              | Required   |          | Password for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| clientId              | Required   |          | OAuth 2.0 client ID.                                                                                                                                                                                                                                                                                                            |
| clientSecret          | Optional   |          | OAuth 2.0 client secret (optional, depending on your OAuth server configuration).                                                                                                                                                                                                                                               |
| scope                 | Optional   |          | OAuth 2.0 scope (optional, space-separated list of scopes).                                                                                                                                                                                                                                                                     |

**Note:** The OAuth interceptor automatically handles token refresh when the token is about to expire (1 minute before expiration).

##### OAuth 2.0 configuration example

```javascript
const rpConfig = {
  endpoint: 'https://your.reportportal.server/api/v2',
  project: 'Your reportportal project name',
  launch: 'Your launch name',
  oauth: {
    tokenEndpoint: 'https://your-oauth-server.com/oauth/token',
    username: 'your-username',
    password: 'your-password',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret', // optional
    scope: 'reportportal', // optional
  }
};
```

### General options

| Option                             | Necessity | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|------------------------------------|-----------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| endpoint                           | Required  |           | URL of your server. For example 'https://server:8080/api/v1'. Use `api/v2` for asynchronous reporting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| launch                             | Required  |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| project                            | Required  |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| attributes                         | Optional  | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| description                        | Optional  | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| rerun                              | Optional  | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| rerunOf                            | Optional  | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name. Works only if `rerun` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| mode                               | Optional  | 'DEFAULT' | Results will be submitted to Launches page <br/> *'DEBUG'* - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| skippedIssue                       | Optional  | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                                                                                                                                                                                                                                                                                                                                                            |
| debug                              | Optional  | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| launchId                           | Optional  | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN_PROGRESS' status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| restClientConfig                   | Optional  | Not set   | `axios` like http client [config](https://github.com/axios/axios#request-config). May contain `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, and other client options e.g. `proxy`, [`timeout`](https://github.com/reportportal/client-javascript#timeout-30000ms-on-axios-requests). For debugging and displaying logs the `debug: true` option can be used. Use the retry property (number or axios-retry config) to customise [automatic retries](https://github.com/reportportal/client-javascript?tab=readme-ov-file#retry-configuration). <br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| isLaunchMergeRequired              | Optional  | false     | This flag determines whether to create temp files with the UUIDs of started launches and allow them to be merged using [`client-javascript`'s `mergeLaunches` method](https://github.com/reportportal/client-javascript#mergelaunches). Temp file format: `rplaunch-${launch_uuid}.tmp`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| launchUuidPrint                    | Optional  | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| launchUuidPrintOutput              | Optional  | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR', 'FILE', 'ENVIRONMENT'. Works only if `launchUuidPrint` set to `true`. File format: `rp-launch-uuid-${launch_uuid}.tmp`. Env variable: `RP_LAUNCH_UUID`, note that the env variable is only available in the reporter process (it cannot be obtained from tests).                                                                                                                                                                                                                                                                                                                                                                                                 |
| extendTestDescriptionWithLastError | Optional  | true      | If set to `true` the latest error log will be attached to the test case description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

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

This is for your convenience if you have a continuous job that runs your tests and may report results that point to a different reportportal project definition, launch name, or attributes.

**2.** Add script to `package.json` file:
```json
{
  "scripts": {
    "test": "jest --config ./jest.config.js"
  }
}
```

## Asynchronous API

The client supports an asynchronous reporting (via the ReportPortal asynchronous API).
If you want the client to report through the asynchronous API, change `v1` to `v2` in the `endpoint` address.

**Note:** It is highly recommended to use the `v2` endpoint for reporting, especially for extensive test suites.

## Features

### Retries

The agent has support of retries.
Read more about [retries in jest](https://jestjs.io/ru/docs/jest-object#jestretrytimesnumretries-options).

## Reporting API

This reporter provides `ReportingApi` in global variables to use it directly in tests to send some additional data to the report.

*Note:* Run with the default test files concurrency may lead to inconsistent files attaching. `ReportingApi` also does not support tests running in [`concurrent` mode](https://jestjs.io/docs/api#testconcurrentname-fn-timeout) at the moment.

We are going to fix this behavior in the future.

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

## Usage with sharded tests

The Jest supports [test sharding](https://jestjs.io/docs/cli#--shard) on multiple machines.

Thus, in order to have a single launch in ReportPortal for sharded tests, additional customization is required.
There are several options to achieve this:

* [Using the `launchId` config option](#using-the-launchid-config-option)
* [Merging launches based on the build ID](#merging-launches-based-on-the-build-id)

**Note:** The [`@reportportal/client-javascript`](https://github.com/reportportal/client-javascript) SDK used here as a reference, but of course the same actions can be performed by sending requests to the ReportPortal API directly.

### Using the `launchId` config option

The complete example of `launchId` usage with shards can be found for our [examples repo](https://github.com/reportportal/examples-js) with [GitHub Actions pipeline](https://github.com/reportportal/examples-js/blob/main/.github/workflows/CI-pipeline.yml), so you can use it as a reference while following this guide.

The agent supports the `launchId` parameter to specify the ID of the already started launch.
This way, you can start the launch using `@reportportal/client-javascript` before the test run and then specify its ID in the config or via environment variable.

1. Trigger a launch before all tests.

The `@reportportal/client-javascript` `startLaunch` method can be used.

```javascript
/*
* startLaunch.js
* */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
    // ...
};

async function startLaunch() {
  const client = new rpClient(rpConfig);
   // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#startlaunch for the details
  const response = await client.startLaunch({
    name: rpConfig.launch,
    attributes: rpConfig.attributes,
    // etc.
  }).promise;

  return response.id;
}

const launchId = await startLaunch();
```
Received `launchId` can be exported e.g. as an environment variable to your CI job.

2. Specify the launch ID for each job.
This step depends on your CI provider and the available ways to path some values to the Node.js process.
The launch ID can be set directly to the [reporter config](https://github.com/reportportal/agent-js-jest#:~:text=Useful%20for%20debugging.-,launchId,-Optional).
```javascript
/*
* jest.config.js
* */
const rpConfig = {
  // ...
  launchId: 'receivedLaunchId'
};
```
or just set as `RP_LAUNCH_ID` environment variable.

With launch ID provided, the agent will attach all test results to that launch.
So it won't be finished by the agent and should be finished separately.

3. As a run post-step (when all tests finished), launch also needs to be finished separately.

The `@reportportal/client-javascript` `finishLaunch` method can be used.

```javascript
/*
* finishLaunch.js
* */
const RPClient = require('@reportportal/client-javascript');

const rpConfig = {
    // ...
};

const finishLaunch = async () => {
  const client = new RPClient(rpConfig);
  const launchTempId = client.startLaunch({ id: process.env.RP_LAUNCH_ID }).tempId;
  // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#finishlaunch for the details
  await client.finishLaunch(launchTempId, {}).promise;
};

await finishLaunch();
```

### Merging launches based on the build ID

This approach offers a way to merge several launches reported from different shards into one launch after the entire test execution completed and launches are finished.
* With this option the Auto-analysis, Pattern-analysis and Quality Gates will be triggered for each sharded launch individually.
* The launch numbering will be changed as each sharded launch will have its own number.
* The merged launch will be treated as a new launch with its own number.

This approach is equal to merging launches via [ReportPortal UI](https://reportportal.io/docs/work-with-reports/OperationsUnderLaunches/#merge-launches).

1. Specify a unique CI build ID as a launch attribute, which will be the same for different jobs in the same run (this could be a commit hash or something else).
This step depends on your CI provider and the available ways to path some values to the Node.js process.
```javascript
/*
* playwright.config.js
* */
const rpConfig = {
  // ...
  attributes: [
    {
      key: 'CI_BUILD_ID',
      // e.g.
      value: process.env.GITHUB_COMMIT_SHA,
    }
  ],
};
```

2. Collect the launch IDs and call the merge operation.

The ReportPortal API can be used to filter the required launches by the provided attribute to collect their IDs.

```javascript
/*
* mergeRpLaunches.js
* */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

const client = new rpClient(rpConfig);

async function mergeLaunches() {
  const ciBuildId = process.env.CI_BUILD_ID;
  if (!ciBuildId) {
    console.error('To merge multiple launches, CI_BUILD_ID must not be empty');
    return;
  }
  try {
    // 1. Send request to get all launches with the same CI_BUILD_ID attribute value
    const params = new URLSearchParams({
      'filter.has.attributeValue': ciBuildId,
    });
    const launchSearchUrl = `launch?${params.toString()}`;
    const response = await client.restClient.retrieveSyncAPI(launchSearchUrl);
    // 2. Filter them to find launches that are in progress
    const launchesInProgress = response.content.filter((launch) => launch.status === 'IN_PROGRESS');
    // 3. If exists, just return. The steps can be repeated in some interval if needed
    if (launchesInProgress.length) {
      return;
    }
    // 4. If not, merge all found launches with the same CI_BUILD_ID attribute value
    const launchIds = response.content.map((launch) => launch.id);
    const request = client.getMergeLaunchesRequest(launchIds);
    request.description = rpConfig.description;
    request.extendSuitesDescription = false;
    const mergeURL = 'launch/merge';
    await client.restClient.create(mergeURL, request);
  } catch (err) {
    console.error('Fail to merge launches', err);
  }
}

mergeLaunches();
```

Using a merge operation for huge launches can increase the load on ReportPortal's API.
See the details and other parameters available for merge operation in [ReportPortal API docs](https://developers.reportportal.io/api-docs/service-api/versions/5.13/merge-launches-old-uuid-2).

**Note:** Since the options described require additional effort, the ReportPortal team intends to create a CLI for them to make them easier to use, but with no ETA.
Progress can be tracked in this [issue](https://github.com/reportportal/client-javascript/issues/218).

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

This code was based on the [jest-junit](https://github.com/jest-community/jest-junit)
and adapted by team members of [Ontoforce](https://www.ontoforce.com) for the
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
