# jonathan-rp-agent-js-jest

A Jest reporter that uploads the results to a [ReportPortal](http://reportportal.io/) server.

## Installation

```shell
npm install --save-dev onathan-rp-agent-js-jest
```

## Usage

In your jest config section of `package.json`, add the following entry:

```JSON
{
    "jest": {
        ...
        "reporters": [
            "default",
            ["@reportportal/agent-js-jest",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "endpoint": "https://your.reportportal.server/api/v1",
                "project": "YourReportPortalProjectName",
                "launch": "YourLauncherName",
                "description": "YourDescription",
                "logLaunchLink": true,
                "attributes": [
                    {
                        "key": "YourKey",
                        "value": "YourValue"
                    },
                    {
                        "value": "YourValue"
                    },
                ],
                "restClientConfig": {
                  "timeout": 0
                }
            }]
        ],
        ...
    }
}
```

In case you use `jest.config.js`, you should add to it the following:

```javascript

module.exports = {
    ...
    reporters: [
        "default",
        [
            "@reportportal/agent-js-jest",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "endpoint": "https://your.reportportal.server/api/v1",
                "project": "YourReportPortalProjectName",
                "launch": "YourLauncherName",
                "description": "YourDescription",
                "logLaunchLink": true,
                "attributes": [
                    {
                        "key": "YourKey",
                        "value": "YourValue"
                    },
                    {
                        "value": "YourValue"
                    },
                ]
            }
        ]
    ]
    ...
```
You can disable it adding `"enabled": false` as an configuration.
It's possible by using environment variables, it's important to mention that environment variables has precedence over `package.json` definition.

```shell
$ export RP_ENABLED=false
$ export RP_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
$ export RP_PROJECT_NAME=MY_AWESOME_PROJECT
$ export RP_ENDPOINT=MY_RP_ENDPOINT
$ export RP_LAUNCH=MY_COOL_LAUNCHER
$ export RP_DESCRIPTION=RP_DESCRIPTION
$ export RP_ATTRIBUTES=key:value,key:value,value
$ export RP_LAUNCH_ID=EXIST_LAUNCH_ID
$ export RP_MODE=DEBUG
```

This for your convenience in case you has a continuous job that run your tests and may post the results pointing to a different Report Portal definition of project, launcher name or tags.

## Disable the colors of test output:

In the Report Portal, the output of the test results may contain ANSI character set, this may be caused by the color setting in Jest. For version `"jest": "^24.8.0"`, use `jest --no-colors` command to disable the colors of test output.

## Used to report retry of test:

The agent supports of Retries.
Read more about [retries in jest](https://jestjs.io/docs/ru/jest-object#jestretrytimes).

## Rerun:

To report [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md) to the report portal you need to specify the following options:

-   rerun - to enable rerun
-   rerunOf - UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name

Example:

```json
"rerun": true,
"rerunOf": "f68f39f9-279c-4e8d-ac38-1216dffcc59c"
```

## Skipped issue:

_Default: true._ ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> _TRUE_ - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal.<br> _FALSE_ - skipped tests will not be marked as 'To Investigate' on application.

Example:

```json
"skippedIssue": false
```

## Launch mode:

Launch mode. Allowable values _DEFAULT_ (by default) or _DEBUG_.

Example:

```json
"mode": "DEBUG"
```

## Debug flag:

This flag allows seeing the logs of the client-javascript. Useful for debugging an agent.

Example:

```json
"debug": true
```

## LogLaunchLink flag:

This flag allows print the URL of the Launch of the tests in console.

Example:

```json
"logLaunchLink": true
```

## REST Client config:

Optional property.<br/>
The object with `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, may contain other client options eg. `timeout`.<br/>
Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details.

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

This code was based on the [jest-junit](https://github.com/jest-community/jest-junit)
and adapted by team members of [Ontoforce](https://www.ontoforce.com) for the
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
