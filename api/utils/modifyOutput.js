const _ = require('lodash');

const modifyOutput = (input, truncateLength) => {
  return input.length > truncateLength
    ? `${_.truncate(input, {
        length: truncateLength,
        omission: '(...)',
      })}`
    : input;
};

module.exports = modifyOutput;