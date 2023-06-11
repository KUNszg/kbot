const path = require('path');

const getFileNames = filenames => {
  const result = [];

  for (let i = 0; i < filenames.length; i++) {
    result.push(path.parse(filenames[i]).name);
  }

  return result.join(', ');
};

module.exports = getFileNames;
