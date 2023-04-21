#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb website',
  invocation: async (channel, user) => {
    return `${user['username']}, https://kunszg.com/`;
  },
};
