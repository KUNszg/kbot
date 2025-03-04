#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb optout',
  invocation: async (channel, user, message) => {
    try {
      // handle aliases
      const convertToRegexp = input => {
        return new RegExp(`\\b${input}\\b`, 'i');
      };

      const param = message.toLowerCase().split(' ')[2];

      let alias = require('../../data/aliases.json').filter(i => i[param]);

      let [getRegex, getReplacement] = ['', ''];

      if (alias.length) {
        getRegex = convertToRegexp(Object.keys(alias[0]));
        getReplacement = Object.values(alias[0])[0];
      }

      const msg = await utils.getParam(message.replace(getRegex, getReplacement));

      if (!msg[0]) {
        return `${user['username']}, you must provide a command you wish to
                opt-in/out from, check command's help if needed.`;
      }

      const _msg = await utils.getParam(message.toLowerCase(), 1);
      if (msg[0] === 'all') {
        const optout = await utils.query(
          `
                    SELECT *
                    FROM optout
                    WHERE userid=?`,
          [user['user-id']]
        );

        const commands = await utils.query(`
                    SELECT *
                    FROM commands
                    WHERE optoutable="Y"
                    `);

        if (_msg[0] === 'optin' || _msg[0] === 'unoptout') {
          if (optout.length) {
            await utils.query(
              `
                            DELETE FROM optout
                            WHERE userId=?`,
              [user['user-id']]
            );

            return `${user['username']}, you have successfully opted-in for all the commands.`;
          }
          return `${user['username']}, there is nothing to opt-in for, if you wish to opt-out use kb optout`;
        }

        if (!optout.length) {
          for (let i = 0; i < commands.length; i++) {
            await utils.query(
              `
                            INSERT INTO optout (username, userId, command, commandId, date)
                            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [user['username'], user['user-id'], commands[i].command, commands[i].ID]
            );
          }
          return `${user['username']}, you have successfully opted out of all optoutable commands.`;
        }

        return `${user['username']}, you are already opted out of all commands, if you wish to undo that use kb optin all`;
      }

      const command = await utils.query(
        `
                SELECT *
                FROM commands
                WHERE command=?`,
        [msg[0].toLowerCase()]
      );

      if (!command.length) {
        return `${user['username']}, that command does not exist.`;
      }

      if (command[0].optoutable === 'N') {
        return `${user['username']}, specified command is not optoutable.`;
      }

      const optout = await utils.query(
        `
                SELECT *
                FROM optout
                WHERE userid=? AND commandId=?`,
        [user['user-id'], command[0].ID]
      );

      if (_msg[0] === 'optin' || _msg[0] === 'unoptout') {
        if (optout.length) {
          await utils.query(
            `
                        DELETE FROM optout
                        WHERE commandId=? AND userid=?`,
            [command[0].ID, user['user-id']]
          );

          return `${user['username']}, you have successfully
                    opted-in for the command ${command[0].command}.`;
        }
        return `${user['username']}, there is nothing to opt-in for, if you wish to opt-out use kb optout`;
      }

      if (!optout.length) {
        await utils.query(
          `
                    INSERT INTO optout (username, userId, command, commandId, date)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [user['username'], user['user-id'], msg[0].toLowerCase(), command[0].ID]
        );

        return `${user['username']}, you have successfully
                opted out of command ${command[0].command}.`;
      }

      return `${user['username']}, you have already opted out of this command, if you wish to undo that use kb optin [command]`;
    } catch (err) {
      await utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
