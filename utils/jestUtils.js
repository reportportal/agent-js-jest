// eslint-disable-next-line no-confusing-arrow
const _interopRequireDefault = obj => obj && obj.__esModule ? obj : { default: obj },

    load_base_reporter = () => {
        const base_reporter = require('../../../jest/node_modules/jest-cli/build/reporters/base_reporter');
        let result = _interopRequireDefault(base_reporter);

        return result;
    };

module.exports = {
    load_base_reporter
};
