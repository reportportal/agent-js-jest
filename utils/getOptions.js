/* eslint-disable no-process-env */
const path = require('path');
const fs = require('fs');
const constants = require('../constants/index');

const getEnvOptions = () => {
    const options = {};

    for (let name in constants.ENVIRONMENT_CONFIG_MAP) {
        if (process.env[name]) {
            options[constants.ENVIRONMENT_CONFIG_MAP[name]] = process.env[name];
        }
    }

    return options;
};

const getAppOptions = pathToResolve => {
    let traversing = true;

    // Find nearest package.json by traversing up directories until /
    while (traversing) {
        traversing = pathToResolve !== path.sep;

        const pkgpath = path.join(pathToResolve, 'package.json');

        if (fs.existsSync(pkgpath)) {
            let options = (require(pkgpath) || {})['jest-junit'];

            if (Object.prototype.toString.call(options) !== '[object Object]') {
                options = {};
            }

            return options;
        }
        pathToResolve = path.dirname(pathToResolve);
    }

    return {};
};


module.exports = {
    options: (reporterOptions = {}) => ({ ...constants.DEFAULT_OPTIONS, ...reporterOptions,
        ...getAppOptions(process.cwd()), ...getEnvOptions() }),
    getAppOptions: getAppOptions,
    getEnvOptions: getEnvOptions
};
