const packageJson = require('./package.json');

function getAppVersion() {
  return packageJson.version;
}

module.exports = { getAppVersion };