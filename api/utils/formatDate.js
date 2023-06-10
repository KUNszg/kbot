const utils = require('../../lib/utils/utils');

const formatDate = timestamp => {
  if (!timestamp) {
    return "No emotes were recently updated."
  }
  const time = Date.now() - Date.parse(timestamp);
  return `${utils.humanizeDuration(time / 1000)} ago`;
};

module.exports = formatDate;
