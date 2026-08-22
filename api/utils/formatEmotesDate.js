const Commons = require('../../commons/Commons');

const formatEmotesDate = timestamp => {
  if (!timestamp) {
    return 'No emotes were recently updated.';
  }
  const time = Date.now() - Date.parse(timestamp);
  return `${Commons.UtilityRepository().humanizeDuration(time / 1000)} ago`;
};

module.exports = formatEmotesDate;
