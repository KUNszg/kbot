const _ = require('lodash');

const initializeMethodRecurse = (method, params) => {
  if (_.isPlainObject(method)) {
    _.forEach(method, invocation => {
      initializeMethodRecurse(invocation, params);
    });
  }
  else {
    method(params);
  }
};

module.exports = initializeMethodRecurse;