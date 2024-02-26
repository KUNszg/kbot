#!/usr/bin/env node
'use strict';

const utils = require('../../utils/utils.js');
const kb = require('../../commandManager.js').kb;
const got = require('got');

module.exports = {
  invocation: async (channel, user, message) => {
    try {
      const getAlias = await utils.query(
        `
                SELECT *
                FROM user_list
                WHERE userId=?`,
        [user['user-id']]
      );

      if (!getAlias.length) {
        return '';
      }

      const cookieModule = await utils.query(`
                SELECT reminders
                FROM cookieModule
                WHERE type="cookie"`);

      if (cookieModule[0].reminders === 'false') {
        return '';
      }
      const query = await utils.query(
        `
                SELECT *
                FROM cookie_reminders
                WHERE user_alias=?`,
        [getAlias[0].ID]
      );

      const userChannel = `#${user['username']}`;
      const channelNoPing = channel.replace(/^(.{2})/, '$1\u{E0000}');
      if (!query.length) {
        return '';
      }

      const cookieApi = await got(
        `https://api.roaringiron.com/cooldown/${user['user-id']}?id=true`
      ).json();

      Date.prototype.addMinutes = function (minutes) {
        const copiedDate = new Date(this.getTime());
        return new Date(copiedDate.getTime() + minutes * 1000);
      };

      if (!cookieApi || typeof cookieApi.seconds_left === 'undefined') {
        return '';
      }

      if (
        cookieApi.seconds_left < cookieApi.interval_unformatted - 10 ||
        cookieApi.seconds_left === 0
      ) {
        if (!cookieApi.time_left_formatted) {
          return '';
        }

        kb.whisper(
          user['username'],
          `Your cookie is still on cooldown (${cookieApi.time_left_formatted}) with ${cookieApi.interval_formatted} intervals.`
        );
        return '';
      } else {
        await utils.query(
          `
                    UPDATE cookie_reminders
                    SET cookie_count=?
                    WHERE user_alias=?`,
          [query[0].cookie_count + 1, getAlias[0].ID]
        );

        const now = new Date();

        const timestamp = now
          .addMinutes(cookieApi.interval_unformatted)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ');

        await utils.query(
          `
                    UPDATE cookie_reminders
                    SET channel=?,
                        fires=?,
                        status="scheduled"
                    WHERE user_alias=?`,
          [channel.replace('#', ''), timestamp, getAlias[0].ID]
        );

        if (query[0].initplatform === 'channel') {
          if (query[0].status === 'scheduled') {
            kb.say(
              userChannel,
              `${user['username']}, updating your pending cookie reminder,
                            I will remind you in ${cookieApi.interval_formatted}
                            (channel ${channelNoPing}) :D`
            );
          } else {
            kb.say(
              userChannel,
              `${user['username']}, I will remind you to eat the cookie in
                            ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`
            );
          }
        } else if (query[0].initplatform === 'whisper') {
          if (query[0].status === 'scheduled') {
            kb.whisper(
              user['username'],
              `updating your pending cookie reminder,
                            I will remind you in ${cookieApi.interval_formatted}
                            (channel ${channelNoPing}) :D`
            );
          } else {
            kb.whisper(
              user['username'],
              `I will remind you to eat the
                            cookie in ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`
            );
          }
        } else if (query[0].initplatform === 'silence') {
          return '';
        }
      }
      return '';
    } catch (err) {
      utils.errorLog(err);
      return '';
    }
  },
};
