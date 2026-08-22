const moment = require('moment');

const getEmoteDate = timestamp => {
  if (!timestamp) {
    return null;
  }

  const date = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');

  if (date === 'Invalid date') {
    return null;
  }

  return date;
};

module.exports = getEmoteDate;
