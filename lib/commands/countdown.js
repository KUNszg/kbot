#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb countdown',
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message);

      if (!msg[0]) {
        return `${user['username']}, you have to provide time in seconds to generate result.`;
      }

      this.msg = msg[0].match(/[0-9]{1,}/g) ?? '';

      if (this.msg > 31556926) {
        // 1 year
        return `${user['username']}, value out of range, maximum value is 1 year`;
      }

      const seconds = Date.now() / 1000 + Number(this.msg);

      const code = utils.genString();

      await utils.query(
        `
                INSERT INTO countdown (verifcode, seconds, username, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [code, seconds, user['username']]
      );

      return `${user['username']}, your countdown will end in ${utils.humanizeDuration(
        this.msg
      )} https://kunszg.com/countdown?verifcode=${code}`;
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
