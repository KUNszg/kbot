#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const got = require('got');

module.exports = {
  name: 'kb token',
  invocation: async (channel, user, message, platform) => {
    try {
      if (platform === 'whisper') {
        return 'This command is disabled on this platform.';
      }
      if (channel === '#haxk' || channel === '#pajlada' || channel === '#kunszg') {
        const token = await got('https://wowtokenprices.com/current_prices.json').json();

        const howLongAgoEU = Date.now() / 1000 - token.eu.time_of_last_change_unix_epoch;
        const howLongAgoNA = Date.now() / 1000 - token.us.time_of_last_change_unix_epoch;

        return `Current WoW token prices by region:
                EU ${token.eu.current_price}g (change by ${
          token.eu.last_change
        }g, updated ${utils.humanizeDuration(howLongAgoEU)} ago),
                NA ${token.us.current_price}g (change by ${
          token.us.last_change
        }g, updated ${utils.humanizeDuration(howLongAgoNA)} ago)`;
      }
      return `${user['username']}, this command is not usable in this channel`;
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
