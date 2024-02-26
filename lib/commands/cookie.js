#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const got = require('got');
const kb = require('../commandManager.js').kb;

module.exports = {
  name: 'kb cookie',
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message);

      let getAlias = await utils.Get.user(user);

      // check if user is in the database, if not then add him
      // this issue might happen in channels where bot is in no-logging mode
      // and non-existing user in database tries to use the command
      if ((!getAlias[0]?.ID ?? true) && platform === 'chat') {
        await utils.query(
          `
                    INSERT INTO user_list (username, userId, firstSeen, color, added)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [user['username'], user['user-id'], channel.replace('#', ''), user['color']]
        );

        getAlias = await utils.Get.user(user);
      }

      const userData = await utils.query(
        `
                SELECT *
                FROM cookie_reminders
                WHERE user_alias=?`,
        [getAlias[0].ID]
      );

      switch (msg[0]) {
        case 'module':
          if ((await utils.checkPermissions(user['username'])) < 3) {
            return '';
          }
          await utils.query(
            `
                        UPDATE cookieModule
                        SET reminders=?
                        WHERE type="cookie"`,
            [msg[1]]
          );

          return `updated "cookie" module status to ${msg[1]}`;

        case 'force':
          const api = await utils.Get.api().url(message);
          const cookieApi = await got(`${api}/cooldown/${user['username']}`).json();

          const regCheck = await utils.query(
            `
                        SELECT *
                        FROM cookie_reminders
                        WHERE user_alias=?`,
            [getAlias[0].ID]
          );

          // check if user is registered
          if (!regCheck.length) {
            return `${user['username']}, you are not registered for cookie reminder,
                        use "kb cookie register" to do so.`;
          }

          const restrictedChannels = ['#zoil', '#forsen', '#nymn', '#cyr', '#vadikus007'];
          const filterChannels = restrictedChannels.find(i => i === channel);

          if (!cookieApi.seconds_left) {
            if (filterChannels) {
              kb.whisper(user['username'], `you can eat your cookie right now! (?cookie)`);
            }
            return `${user['username']}, you can eat your cookie right now! (!/?cookie)`;
          }

          Date.prototype.addMinutes = function (minutes) {
            const copiedDate = new Date(this.getTime());
            return new Date(copiedDate.getTime() + minutes * 1000);
          };

          const updateReminder = async time => {
            const now = new Date();
            const timestamp = now
              .addMinutes(time)
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

            await utils.query(
              `
                            UPDATE cookie_reminders
                            SET cookie_count=?
                            WHERE user_alias=?`,
              [userData[0].cookie_count + 1, getAlias[0].ID]
            );
          };

          updateReminder(cookieApi.seconds_left.toFixed(0));

          if (filterChannels) {
            kb.whisper(
              user['username'],
              `I will remind you to eat the cookie in
                        ${utils.format(cookieApi.seconds_left.toFixed(0))} (forced reminder)`
            );
          }
          return `${user['username']}, I will remind you to eat the cookie in
                    ${utils.format(cookieApi.seconds_left.toFixed(0))} (forced reminder)`;

        case 'register':
          // check if user is new and insert a new row in database
          if (!userData.length) {
            await utils.query(
              `
                            INSERT INTO cookies (username, created)
                            VALUES (?, CURRENT_TIMESTAMP)`,
              [user['username']]
            );

            await utils.query(
              `
                            INSERT INTO cookie_reminders (username)
                            VALUES (?)`,
              [user['username']]
            );

            await utils.query(
              `
                            UPDATE user_list t1, cookie_reminders t2
                            SET t2.user_alias=t1.ID
                            WHERE t2.username=? AND t1.userId=?`,
              [user['username'], user['user-id']]
            );

            return `${user['username']}, you have been successfully registered for
                        a cookie reminder, see https://kunszg.com/commands for command options`;
          }

          // check if user is already registered
          if (userData[0].user_alias == getAlias[0].ID) {
            return `${user['username']}, you are already registered for cookie reminders, use
                        "kb help cookie" for command syntax.`;
          }
          return '';

        case 'unregister':
          // check if user is registered and delete rows from database
          if (!userData.length) {
            return `${user['username']}, you are not registered for a
                        cookie reminder, therefore you can't be unregistered FeelsDankMan`;
          }

          await utils.query(
            `
                        INSERT INTO trash (username, channel, cmd, added)
                        VALUES (?, ?, "cookie", CURRENT_TIMESTAMP)`,
            [user['username'], channel.replace('#', '')]
          );

          await utils.query(
            `
                        DELETE FROM cookie_reminders
                        WHERE user_alias=?`,
            [getAlias[0].ID]
          );
          return `${user['username']}, you are no longer registered for a cookie reminder.`;

        case 'whisper':
          // check if user is registered
          if (!userData.length || !userData[0].username) {
            return `${user['username']}, you are not registered for the cookie reminder,
                        check out "kb help cookie" to do so.`;
          }

          // when user uses command the first time (feedback in whispers)
          if (
            userData[0].user_alias === getAlias[0].ID &&
            userData[0].initplatform === 'channel'
          ) {
            await utils.query(
              `
                            UPDATE cookie_reminders
                            SET initplatform="whisper"
                            WHERE user_alias=?`,
              [getAlias[0].ID]
            );

            return `${user['username']}, you have changed your feedback and reminder message to appear in
                        whispers. Type this command again to undo it.`;
          }

          // when user uses the command 2nd time (feedback as default in channel)
          if (
            userData[0].user_alias === getAlias[0].ID &&
            userData[0].initplatform === 'whisper'
          ) {
            await utils.query(
              `
                            UPDATE cookie_reminders
                            SET initplatform="channel"
                            WHERE user_alias=?`,
              [getAlias[0].ID]
            );

            return `${user['username']}, you have changed your feedback message to appear in
                            your own channel. Your next cookie reminders will appear in channel where you executed the command.
                            Type this command again to undo it.`;
          }

          // swap from silence to default feedback message
          if (
            userData[0].user_alias === getAlias[0].ID &&
            userData[0].initplatform === 'silence'
          ) {
            await utils.query(
              `
                            UPDATE cookie_reminders
                            SET initplatform="channel"
                            WHERE user_alias=?`,
              [getAlias[0].ID]
            );

            return `${user['username']}, you have changed your feedback message to appear in
                        your own channel. Type this command again to set them to whispers.`;
          }
          return '';

        case 'silence':
          // check if user is registered
          if (!userData.length || !userData[0].username) {
            return `${user['username']}, you are not registered for cookie reminder,
                        check out "kb help cookie" to do so.`;
          }

          // change the feedback message to silence if it's already not set
          if (
            userData[0].user_alias === getAlias[0].ID &&
            userData[0].initplatform != 'silence'
          ) {
            await utils.query(
              `
                            UPDATE cookie_reminders
                            SET initplatform="silence"
                            WHERE user_alias=?`,
              [getAlias[0].ID]
            );

            return `${user['username']}, you will no longer receive
                        feedback from the cookie command.`;
          }
          return `${user['username']}, you are already marked to not receive the feedback.`;

        case 'status':
          // check if user is registered
          if (!userData.length || !userData[0].username) {
            return `${user['username']}, you are not registered for cookie reminder,
                        check out "kb help cookie" to do so.`;
          }

          const getData = await utils.query(
            `
                        SELECT *
                        FROM cookie_reminders
                        WHERE user_alias=?`,
            [getAlias[0].ID]
          );

          return `${user['username']}, you have used cookie reminders ${getData[0].cookie_count}
                    times | feedback message is set to ${getData[0].initplatform} | your current reminder
                    status - ${getData[0].status}`;

        default:
          return `${user['username']}, invalid syntax. See https://kunszg.com/commands for command options.`;
      }
      return '';
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
