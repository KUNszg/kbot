#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb commands',
  invocation: async (channel, user) => {
    return `${user['username']}, You can find current active commands at https://kunszg.com/commands`;
  },
};
