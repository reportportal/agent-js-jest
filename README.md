# reportportal-agent-jest

A Jest reporter that uploads the results to a [ReportPortal](http://reportportal.io/) server.

## Installation

```shell
npm install --save-dev @reportportal/reportportal-agent-jest
```

## Usage
In your jest config section of `package.json`, add the following entry:
```JSON
{
    "jest": {
        ...
        "reporters": [
            "default",
            ["@reportportal/reportportal-agent-jest",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "endpoint": "https://your.reportportal.server/api/v1",
                "project": "YourReportPortalProjectName",
                "launch": "YourLauncherName",
                "description": "YourDescription",
                "attributes": [
                    {
                        "key": "YourKey",
                        "value": "YourValue"
                    },
                    {
                        "value": "YourValue"
                    },
                ]
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
            "@reportportal/reportportal-agent-jest",
            {
                "token": "00000000-0000-0000-0000-000000000000",                
                "endpoint": "https://your.reportportal.server/api/v1",
                "project": "YourReportPortalProjectName",
                "launch": "YourLauncherName",
                "description": "YourDescription",
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

It's possible by using environment variables, it's important to mention that environment variables has precedence over `package.json` definition.

```shell
$ export RP_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
$ export RP_PROJECT_NAME=MY_AWESOME_PROJECT
$ export RP_LAUNCH=MY_COOL_LAUNCHER
$ export RP_ATTRIBUTES=key:value,key:value,value
```
This for your convenience in case you has a continuous job that run your tests and may post the results pointing to a different Report Portal definition of project, launcher name or tags.

## Disable the colors of test output:
In the Report Portal, the output of the test results may contain ANSI character set, this may be caused by the color setting in Jest. For version `"jest": "^24.8.0"`, use `jest --no-colors` command to disable the colors of test output.

## Used to report retry of test:
The agent supports of Retries.
Read more about [retries in jest](https://jestjs.io/docs/ru/jest-object#jestretrytimes).

## Rerun:
To report [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md) to the report portal you need to specify the following options:
- rerun - to enable rerun
- rerunOf - UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name

Example:

```json
"rerun": true,
"rerunOf": "f68f39f9-279c-4e8d-ac38-1216dffcc59c"
```

## Run test example:
Go to the example folder and inside of jest.config.js you need to insert data about your instance of the Report Portal.

To run the tests, type the following command in the console:
```cmd
npm run test
```


# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

This code is based on the [jest-junit](https://github.com/jest-community/jest-junit)
but adapted by team members of [Ontoforce](https://www.ontoforce.com) for the 
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
