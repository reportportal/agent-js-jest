### Added
- Added possibility to attach tests with existing launch
- Added possibility provide RP_ENDPOINT via environment variable
- Added a handle mechanism for waiting for all tests to be reported
- Added display of the duration of tests and suites
- Added new [option](./README.md#loglaunchlink-flag) `logLaunchLink` to print launch url in console.

### Changed
- Package size reduced
- Update packages

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
