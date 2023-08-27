#!/usr/bin/env node
'use strict';

const utils = require('../../utils/utils.js');
const kb = require('../../commandManager.js').kb;
const got = require('got');

module.exports = {
  invocation: async (channel, user, message) => {
    try {
      const checkIfBotIsJoined = await got('https://huwobot.com/api/channels').json();
      const checkChannels = checkIfBotIsJoined.filter(i => i === channel.replace('#', ''));
      if (!checkChannels.length) {
        return '';
      }

      const cookieModule = await utils.query(`
                SELECT reminders
                FROM cookieModule
                WHERE type="ed"`);

      if (cookieModule[0].reminders === 'false') {
        return '';
      }

      const getUserAlias = await utils.query(
        `
                SELECT *
                FROM user_list
                WHERE userId=?`,
        [user['user-id']]
      );

      if (!getUserAlias.length) {
        return '';
      }

      const getUserData = await utils.query(
        `
                SELECT *
                FROM ed_reminders
                WHERE user_alias=?`,
        [getUserAlias[0].ID]
      );

      if (!getUserData.length) {
        return '';
      }

      Date.prototype.addMinutes = function (minutes) {
        var copiedDate = new Date(this.getTime());
        return new Date(copiedDate.getTime() + minutes * 1000);
      };

      const getEdData = await got(`https://huwobot.com/api/user?id=${user['user-id']}`).json();

      if (typeof getEdData.next_entry === 'undefined') {
        return `${user['username']}, you are not registered for huwobot's minigame Pepega`;
      }

      const now = new Date();
      const timeDiff = getEdData.next_entry - getEdData.last_entry;

      const time = now
        .addMinutes(timeDiff.toFixed(0))
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      if (getUserData[0].initPlatform === 'silence') {
        await utils.query(
          `
                    UPDATE ed_reminders
                    SET channel=?,
                        fires=?,
                        status="scheduled",
                        count=?
                    WHERE user_alias=?`,
          [channel.replace('#', ''), time, getUserData[0].count + 1, getUserAlias[0].ID]
        );
        return '';
      }
      // check if ed is still pending
      if (
        getEdData.next_entry.toFixed(0) > Date.now() / 1000 &&
        getEdData.next_entry.toFixed(0) - Date.now() / 1000 < 3565
      ) {
        kb.whisper(
          user['username'],
          `Your dungeon entry is still on cooldown
                        (${utils.humanizeDuration(
                          getEdData.next_entry.toFixed(0) - Date.now() / 1000
                        )})
                        to force-set your reminder use "kb ed force".`
        );
        return '';
      }

      kb.whisper(
        user['username'],
        `I will remind you to enter the dungeon in ${utils.humanizeDuration(timeDiff)} :)`
      );

      await utils.query(
        `
                UPDATE ed_reminders
                SET channel=?,
                    fires=?,
                    status="scheduled",
                    count=?
                WHERE user_alias=?`,
        [channel.replace('#', ''), time, getUserData[0].count + 1, getUserAlias[0].ID]
      );
      return '';
    } catch (err) {
      utils.errorLog(err);
      return '';
    }
  },
};
