### Changed
- `token` configuration option was renamed to `apiKey` to maintain common convention.
- `@reportportal/client-javascript` bumped to version `5.0.12`.

## [5.0.5] - 2023-03-16
### Added
- `RP_DESCRIPTION` & `RP.MODE` env variables support. Thanks to [Jonathan Carvalheiro](https://github.com/Jonathan-Carvalheiro)
### Fixed
- Log messages in RP shown without ANSI characters

## [5.0.4] - 2022-05-30
### Added
- Possibility to provide endpoint url via `RP_ENDPOINT` environment variable
- New [option](./README.md#loglaunchlink-flag) `logLaunchLink` to print launch url in console
### Fixed
- The duration of tests and suites is now displayed correctly
- The reporter will now wait for a report on all tests
- Security vulnerabilities
- Tests without describe block causes error [#82](https://github.com/reportportal/agent-js-jest/issues/82)
### Changed
- Package size reduced

## [5.0.3] - 2021-06-23
### Fixed
- Nested describe blocks are not visible in report
### Updated
- `@reportportal/client-javascript` version to the latest
### Added
- `restClientConfig` configuration property support (more details in [client-javascript](https://github.com/reportportal/client-javascript))

## [5.0.2] - 2021-02-09
### Added
- Debug flag, launch mode configuration properties
### Fixed
- Doesn't start a suite if test has no describe
- Vulnerable dependencies (lodash)

## [5.0.1] - 2020-06-12
### Changed
- Packages publishing workflow improved

## [5.0.0] - 2020-06-11
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))
### Deprecated
- Previous package version (`@reportportal/reportportal-agent-jest`) will no longer supported by reportportal.io
