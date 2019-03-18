const possibleBaseReporterPaths = [
    '../../../@jest/reporters/build/base_reporter', // >=v24.0.0 of jest (verified through 24.5.0)
    '../../../jest/node_modules/jest-cli/build/reporters/base_reporter' // <=v23.6.0 of jest
];
// eslint-disable-next-line no-confusing-arrow
const _interopRequireDefault = obj => obj && obj.__esModule ? obj : { default: obj },

    load_base_reporter = (pathToNodeModulesLocation /*This parameter is for testing*/) => {
        const fs = require('fs');
        const path = require('path');
        var requirePath;
        for (let filePath of possibleBaseReporterPaths) {
            /* This block of code is for testing ****************************************/
            if (pathToNodeModulesLocation !== undefined) {                              //
                filePath = path.join(pathToNodeModulesLocation, filePath);   //
                console.log(filePath)                                                   //
            }                                                                           //
            /****************************************************************************/
            filePath = path.join(__dirname, filePath);
            if (fs.existsSync(`${filePath}.js`)) {
                requirePath = filePath;
                break;
            }
        }
        if (requirePath === undefined) {
            throw new Error(
                `base_reporter.js not found at any of the possible paths:\n${possibleBaseReporterPaths.join('\n')}`);
        }
        const base_reporter = require(requirePath);
        let result = _interopRequireDefault(base_reporter);

        return result;
    };

module.exports = {
    load_base_reporter
};
