#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb rl',
  invocation: async (channel, user, message, platform) => {
    try {
      if (platform === 'whisper') {
        return 'This command is disabled on this platform';
      }

      const checkChannel = await utils.query('SHOW TABLES LIKE ?', [
        `logs_${channel.replace('#', '')}`,
      ]);

      if (!checkChannel.length) {
        return `${user['username']}, I'm not logging this channel, therefore I can't display data for this command :/`;
      }

      const msg =
        message.split(' ')[1] === 'rq' ? utils.getParam(message, 1) : utils.getParam(message);

      if (msg.includes('teodorv')) {
        return 'FeelsBadMan <3';
      }

      const whitelist = [
        'logs_forsen',
        'logs_nymn',
        'logs_vadikus007',
        'logs_kian',
        'logs_pajlada',
        'logs_fabzeef',
        'logs_redshell',
      ];

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
          return this.input.substr(0, 430);
        }
      }

      // kb rq
      if (msg[0] === 'rq') {
        // check if user points to other channel
        let userSpecifiedChannel = msg.find(i => i.startsWith('#'));
        userSpecifiedChannel =
          !global?.userSpecifiedChannel ?? true
            ? userSpecifiedChannel
            : userSpecifiedChannel.toLowerCase();

        if (userSpecifiedChannel) {
          if (
            (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === '#haxk') &&
            userSpecifiedChannel != channel
          ) {
            return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
          }

          // check if user exists in the database
          const checkInputChannel = await utils.query('SHOW TABLES LIKE ?', [
            `logs_${userSpecifiedChannel.replace('#', '')}`,
          ]);

          if (!checkInputChannel.length) {
            return `${user['username']}, I'm not logging the channel you specified :/`;
          }

          this.channel = `logs_${userSpecifiedChannel.replace('#', '')}`;

          let randomResults;

          if (whitelist.filter(i => i === this.channel).length) {
            const max = await utils.query(
              `
                            SELECT COUNT(*) as count
                            FROM ??
                            WHERE username=?`,
              [this.channel, user['username']]
            );

            const rand = Math.floor(Math.random() * max[0].count) + 1;

            randomResults = await utils.query(
              `
                            SELECT *
                            FROM ??
                            WHERE username=? LIMIT 30 OFFSET ${rand}`,
              [this.channel, user['username']]
            );
          } else {
            randomResults = await utils.query(
              `
                            SELECT t.*
                            FROM ?? AS t
                            JOIN (
                                SELECT ROUND(
                                    RAND() * (SELECT MAX(id) FROM ??)
                                ) AS id) AS x
                            WHERE t.id >= x.id and username=? LIMIT 1;`,
              [this.channel, this.channel, user['username']]
            );
          }

          if (!randomResults.length) {
            return `${user['username']}, I don't have any logs from this channel related to you :z`;
          }

          const randomResult = utils.random(randomResults);

          const timeDifference = Math.abs(Date.now() - Date.parse(randomResult.date)) / 1000;

          const result = new ModifyOutput(randomResult.message);

          return `${userSpecifiedChannel.replace(
            /^(.{2})/,
            '$1\u{E0000}'
          )} (${utils.humanizeDuration(timeDifference)} ago) ${
            randomResult.username
          }: ${result.trimmer()}`;
        }

        if (!checkChannel.length) {
          return `${user['username']}, I'm not logging this channel, therefore I can't display data for this command :/`;
        }

        this.channel = `logs_${channel.replace('#', '')}`;

        let randomResults;

        if (whitelist.filter(i => i === this.channel).length) {
          const max = await utils.query(
            `
                        SELECT COUNT(*) as count
                        FROM ??
                        WHERE username=?`,
            [this.channel, user['username']]
          );

          const rand = Math.floor(Math.random() * max[0].count) + 1;

          randomResults = await utils.query(
            `
                        SELECT *
                        FROM ??
                        WHERE username=? LIMIT 30 OFFSET ${rand}`,
            [this.channel, user['username']]
          );
        } else {
          randomResults = await utils.query(
            `
                        SELECT t.*
                        FROM ?? AS t
                        JOIN (
                            SELECT ROUND(
                                RAND() * (SELECT MAX(id) FROM ??)
                            ) AS id) AS x
                        WHERE t.id >= x.id and username=? LIMIT 1;`,
            [this.channel, this.channel, user['username']]
          );
        }

        if (!randomResults.length) {
          return `${user['username']}, I don't have any logs from this channel related to you :z`;
        }

        const randomResult = utils.random(randomResults);

        const timeDifference = Math.abs(Date.now() - Date.parse(randomResult.date)) / 1000;

        const result = new ModifyOutput(randomResult.message);

        return `(${utils.humanizeDuration(timeDifference)} ago) ${
          randomResult.username
        }:  ${result.trimmer()}`;
      }

      // kb rl
      if (!msg[0]) {
        const maxID = await utils.query(
          `
                    SELECT MAX(ID) AS number
                    FROM ??`,
          [`logs_${channel.replace('#', '')}`]
        );

        // get random ID from the range of ID's in table
        const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

        const randomLine = await utils.query(
          `
					SELECT ID, username, message, date
					FROM ??
					WHERE ID=?`,
          [`logs_${channel.replace('#', '')}`, randNum]
        );

        if (!randomLine.length) {
          return `${user['username']}, I don't have any logs from this channel :z`;
        }

        const timeDifference = Math.abs(Date.now() - Date.parse(randomLine[0].date)) / 1000;

        const result = new ModifyOutput(randomLine[0].message);

        return `(${utils.humanizeDuration(timeDifference)} ago) ${
          randomLine[0].username
        }:  ${result.trimmer()}`;
      }

      if ((msg?.[0] ?? false) && msg[0] != '') {
        // check if user points to other channel
        let userSpecifiedChannel = msg.find(i => i.startsWith('#'));
        let userSpecifiedUsername = msg.find(i => i.startsWith('@'));

        // kb rl [#channel]
        if (
          typeof userSpecifiedChannel != 'undefined' &&
          typeof userSpecifiedUsername === 'undefined'
        ) {
          if (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === '#haxk') {
            return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
          }

          // check if user exists in the table
          const checkIfLogging = await utils.query(
            `
						SHOW TABLES LIKE ?`,
            [`logs_${userSpecifiedChannel.replace('#', '')}`]
          );

          if (!checkIfLogging.length) {
            return `${user['username']}, I'm not logging the channel you specified :/`;
          }

          const maxID = await utils.query(`SELECT MAX(ID) AS number FROM ??`, [
            `logs_${userSpecifiedChannel.replace('#', '')}`,
          ]);

          const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

          const randomLine = await utils.query(
            `
						SELECT ID, username, message, date
						FROM ?? WHERE ID=?`,
            [`logs_${userSpecifiedChannel.replace('#', '')}`, randNum]
          );

          if (!randomLine.length) {
            return `${user['username']}, I don't have any logs from this channel :z`;
          }

          const timeDifference = Math.abs(Date.now() - Date.parse(randomLine[0].date)) / 1000;

          const result = new ModifyOutput(randomLine[0].message);

          return `${userSpecifiedChannel.replace(
            /^(.{2})/,
            '$1\u{E0000}'
          )} (${utils.humanizeDuration(timeDifference)} ago) ${
            randomLine[0].username
          }: ${result.trimmer()}`;
        }

        // kb rl [@user] [#channel]
        if (
          typeof userSpecifiedChannel != 'undefined' &&
          typeof userSpecifiedUsername != 'undefined'
        ) {
          if (userSpecifiedChannel.replace('#', '') === 'forsen') {
            return `${user['username']}, that channel is not available for this command.`;
          }

          const checkIfOptedOut = await utils.query(
            `
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
            ['rl', userSpecifiedUsername.toLowerCase().replace(/@|,/g, '')]
          );

          if (
            checkIfOptedOut.length &&
            user['username'] != userSpecifiedUsername.toLowerCase().replace(/@|,/g, '')
          ) {
            return `${user['username']}, that user has opted out from being a target of this command.`;
          }

          if (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === '#haxk') {
            return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
          }

          const checkIfLogging = await utils.query(
            `
                        SHOW TABLES LIKE ?`,
            [`logs_${userSpecifiedChannel.replace('#', '')}`]
          );

          if (!checkIfLogging.length) {
            return `${user['username']}, I'm not logging the channel you specified :/`;
          }

          const checkUser = await utils.query(
            `
                        SELECT *
                        FROM user_list
                        WHERE username=?`,
            [userSpecifiedUsername.replace('@', '')]
          );

          if (!checkUser.length) {
            return `${user['username']}, user ${userSpecifiedUsername.replace(
              '@',
              ''
            )} was not found in the database.`;
          }

          this.username = userSpecifiedUsername.replace('@', '');
          this.channel = `logs_${userSpecifiedChannel.replace('#', '')}`;

          let randomResults;

          if (whitelist.filter(i => i === this.channel).length) {
            const max = await utils.query(
              `
                            SELECT COUNT(*) as count
                            FROM ??
                            WHERE username=?`,
              [this.channel, this.username]
            );

            const rand = Math.floor(Math.random() * max[0].count) + 1;

            randomResults = await utils.query(
              `
                            SELECT *
                            FROM ??
                            WHERE username=? LIMIT 30 OFFSET ${rand}`,
              [this.channel, this.username]
            );
          } else {
            randomResults = await utils.query(
              `
                            SELECT t.*
                            FROM ?? AS t
                            JOIN (
                                SELECT ROUND(
                                    RAND() * (SELECT MAX(id) FROM ??)
                                ) AS id) AS x
                            WHERE t.id >= x.id and username=? LIMIT 1;`,
              [this.channel, this.channel, this.username]
            );
          }

          if (!randomResults.length) {
            return `${user['username']}, there are no logs in my database from this channel related to that user.`;
          }

          const randomResult = utils.random(randomResults);

          const timeDifference = Math.abs(Date.now() - Date.parse(randomResult.date)) / 1000;

          const result = new ModifyOutput(randomResult.message);

          return `${userSpecifiedChannel.replace(
            /^(.{2})/,
            '$1\u{E0000}'
          )} (${utils.humanizeDuration(timeDifference)} ago) ${
            randomResult.username
          }: ${result.trimmer()}`;
        }

        // kb rl [@user]
        const checkIfOptedOut = await utils.query(
          `
                    SELECT *
                    FROM optout
                    WHERE command=? AND username=?`,
          ['rl', msg[0].toLowerCase().replace(/@|,/g, '')]
        );

        if (
          checkIfOptedOut.length &&
          user['username'] != msg[0].toLowerCase().replace(/@|,/g, '')
        ) {
          return `${user['username']}, that user has opted out from being a target of this command.`;
        }

        // check if user exists in the database
        const checkIfUserExists = await utils.query(
          `
                    SELECT *
                    FROM user_list
                    WHERE username=?`,
          [msg[0].replace('@', '').replace(',', '')]
        );

        if (!checkIfUserExists.length) {
          return `${user['username']}, this user does not exist in my user list logs.`;
        }

        this.username = msg[0].replace('@', '').replace(',', '');
        this.channel = `logs_${channel.replace('#', '')}`;

        let randomResults;

        if (whitelist.filter(i => i === this.channel).length) {
          const max = await utils.query(
            `
                        SELECT COUNT(*) as count
                        FROM ??
                        WHERE username=?`,
            [this.channel, this.username]
          );

          const rand = Math.floor(Math.random() * max[0].count) + 1;

          randomResults = await utils.query(
            `
                        SELECT *
                        FROM ??
                        WHERE username=? LIMIT 30 OFFSET ${rand}`,
            [this.channel, this.username]
          );
        } else {
          randomResults = await utils.query(
            `
                        SELECT t.*
                        FROM ?? AS t
                        JOIN (
                            SELECT ROUND(
                                RAND() * (SELECT MAX(id) FROM ??)
                            ) AS id) AS x
                        WHERE t.id >= x.id and username=? LIMIT 1;`,
            [this.channel, this.channel, this.username]
          );
        }

        if (!randomResults.length) {
          return `${user['username']}, there are no logs in my database from this channel related to that user.`;
        }

        const randomResult = utils.random(randomResults);

        const timeDifference = Math.abs(Date.now() - Date.parse(randomResult.date)) / 1000;

        const result = new ModifyOutput(randomResult.message);

        return `(${utils.humanizeDuration(timeDifference)} ago) ${
          randomResult.username
        }:  ${result.trimmer()}`;
      }
    } catch (err) {
      utils.errorLog(err);
      return ``;
    }
  },
};
