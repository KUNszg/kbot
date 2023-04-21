#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb npm',
  invocation: async (channel, user, message) => {
    try {
      if ((await utils.checkPermissions(user['username'])) < 1) {
        return '';
      }

      const msg = utils.getParam(message);

      if (!msg[0]) {
        return `${user['username']}, You have not provided any input FeelsDankMan`;
      }

      return 'https://' + encodeURI(`www.npmjs.com/search?q=${msg.join(' ')}`);
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
