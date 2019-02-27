function _interopRequireDefault(obj) { 
    return obj && obj.__esModule ? obj : { default: obj }; 
}

function load_base_reporter() {
  return _base_reporter = _interopRequireDefault(require('../../jest/node_modules/jest-cli/build/reporters/base_reporter'));
}

module.exports = {
    load_base_reporter
}