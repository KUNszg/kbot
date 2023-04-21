#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb rl',
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message.toLowerCase().replace(/@|,/g, ''));

      if (!msg[0]) {
        return `${user['username']}, you have to provide a user.`;
      }

      if (msg[0] === user['username']) {
        return `${user['username']}, you are right here FeelsDankMan`;
      }

      if (msg[0] === 'ksyncbot' || msg[0] === 'kunszgbot') {
        return `${user['username']}, no, I don't think so`;
      }

      const checkIfOptedOut = await utils.query(
        `
                SELECT *
                FROM optout
                WHERE command=? AND username=?`,
        ['ls', msg[0]]
      );

      if (checkIfOptedOut.length && user['username'] != msg[0]) {
        return `${user['username']}, that user has opted out from being a target of this command.`;
      }

      const userData = await utils.query(
        `
                SELECT *
                FROM user_list
                WHERE username=?`,
        [msg[0]]
      );

      if (!userData.length) {
        return `${user['username']}, this user does not exist in my logs.`;
      }

      if (userData[0].lastSeen === null) {
        return `${user['username']}, this user exists but has no last message saved.`;
      }

      // checks if output message is not too long
      class ModifyOutput {
        constructor(input) {
          this.input = input;
        }

        trimmer() {
          if (channel === '#forsen' || channel === '#vadikus007') {
            if (this.input.includes('⣿')) {
              return ' [braille copypasta]';
            }
            return this.input.length > 93 ? `${this.input.substr(0, 93)}(...)` : this.input;
          }
          return this.input.length > 250 ? `${this.input.substr(0, 250)}(...)` : this.input;
        }
      }

      const lastSeenDate = userData[0].lastSeen.split('*')[0];
      const time = Math.abs(Date.now() - Date.parse(lastSeenDate)) / 1000;

      const lastSeenMessage = userData[0].lastSeen.split('*').splice(2).join('*');
      const result = new ModifyOutput(lastSeenMessage);

      const lastSeenChannel = userData[0].lastSeen.split('*')[1];

      if ((lastSeenChannel === 'haxk' || lastSeenChannel === 'axo__') && lastSeenChannel != channel.replace('#', '')) {
        return `${user['username']}, this user was last seen in a channel that is opted out ${utils.humanizeDuration(time)} ago`;
      }

      return `${user['username']}, this user's last message was in channel ${lastSeenChannel.replace(
        /^(.{2})/,
        '$1\u{E0000}'
      )} ${utils.humanizeDuration(time)} ago and their message was: ${result.trimmer()}`;
    } catch (err) {
      utils.errorLog(err);
      return ``;
    }
  },
};
