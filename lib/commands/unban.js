#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb unban',
  invocation: async (channel, user, message, platform) => {
    try {
      if ((await utils.checkPermissions(user['username'])) < 3) {
        return '';
      }

      if (platform === 'whisper') {
        return 'This command is disabled on this platform';
      }

      const msg = utils.getParam(message);
      const comment = utils.getParam(message, 3);

      const got = require('got');
      const userid = await got(`https://api.ivr.fi/twitch/resolve/${msg[0]}`).json();

      const checkRepeatedInsert = await utils.query(
        `
                SELECT *
                FROM ban_list
                WHERE user_id=?`,
        [userid.id]
      );

      if (!checkRepeatedInsert.length) {
        return `${user['username']}, no such user found in the database.`;
      }

      // delete the row with unbanned user
      await utils.query(
        `
                DELETE FROM ban_list
                WHERE username=?`,
        [msg[0].toLowerCase()]
      );

      // insert into a table to store previously banned users
      await utils.query(
        `
                INSERT INTO unbanned_list (username, user_id, unbanned_by, date)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [msg[0], userid.id, user['username']]
      );

      return `${user['username']}, user with ID ${userid.id} has been unbanned from the bot`;
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
