#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb google',
  invocation: async (channel, user, message) => {
    if ((await utils.checkPermissions(user['username'])) < 1) {
      return '';
    }

    const msg = utils.getParam(message);

    if (!msg[0]) {
      return `${user['username']}, You have not provided any input FeelsDankMan`;
    }

    return encodeURI(`google.com/search?q=${msg.join(' ')}`);
  },
};
