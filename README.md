# reportportal-agent-jest

A Jest reporter that uploads the results to a [ReportPortal](http://reportportal.io/) server.

## Installation

```shell
npm install --save-dev reportportal-agent-jest
```

## Usage
In your jest config section of `package.json`, add the following entry:
```JSON
{
    "jest": {
        ...
        "reporters": [
            "reportportal-agent-jest",
            {
            "endpoint": "https://your.reportportal.server/api/v1",
            "project": "YourReportPortalProjectName"
            }
        ],
        ...
    }
}
```

First configure your ReportPortal access token, then start Jest:

```shell
$ export RP_TOKEN=<your_secure_token>
$ jest
```

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

This code is based on the [jest-junit](https://github.com/jest-community/jest-junit)
but adapted by team members of [Ontoforce](https://www.ontoforce.com) for the 
ReportPortal upload. Ontoforce contributed this effort as Open Source to the
ReportPortal project team.
