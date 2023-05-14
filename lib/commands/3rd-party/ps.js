#!/usr/bin/env node
'use strict';

const utils = require('../../utils/utils.js');

module.exports = {
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message, 1);

      if (!msg[0]) {
        return '';
      }

      if (channel != '#supinic') {
        return '';
      }

      const getPSData = await utils.query(
        `
                SELECT *
                FROM playsounds
                WHERE name=?`,
        [msg[0]]
      );

      if (!getPSData.length) {
        return '';
      }
      if (
        getPSData[0].last_executed === 'null' ||
        (Date.parse(getPSData[0].last_executed) - Date.parse(new Date())) / 1000 > 1
      ) {
        return '';
      }
      Date.prototype.addSeconds = function (seconds) {
        var copiedDate = new Date(this.getTime());
        return new Date(copiedDate.getTime() + seconds * 1000);
      };
      const now = new Date();
      const time = now
        .addSeconds(getPSData[0].cooldown / 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      await utils.query(
        `
                UPDATE playsounds
                SET last_executed=?
                WHERE name=?`,
        [time, msg[0]]
      );

      return '';
    } catch (err) {
      utils.errorLog(err);
    }
  },
};
