const _ = require('lodash');

const getModuleData = (input, modules) => {
  const moduleData = _.filter(modules, i => i.type === 'module' && i.sha === input);

  return Date.parse(_.get(_.first(moduleData), "date"));
};

module.exports = getModuleData;