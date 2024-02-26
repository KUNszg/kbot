#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const bot = require('../commandManager.js');

module.exports = {
  name: 'kb trust',
  invocation: async (channel, user, message, platform) => {
    try {
      if ((await utils.checkPermissions(user['username'])) < 5) {
        return '';
      }

      if (platform === 'whisper') {
        return 'This command is disabled on this platform';
      }

      const msg = utils.getParam(message);

      if (!msg[0]) {
        return `${user['username']}, no user provided.`;
      }

      if (!msg[1]) {
        return `${user['username']}, no permission specified.`;
      }

      const checkIfExists = await utils.query(
        `
				SELECT *
				FROM user_list
				WHERE username=?;`,
        [msg[0]]
      );

      if (!checkIfExists.length) {
        return `${user['username']}, this user does not exist in my database.`;
      }

      const checkTrustedList = await utils.query(
        `
				SELECT *
				FROM trusted_users
				WHERE username=?`,
        [msg[0]]
      );

      if (msg[1] === 'active') {
        if (!checkTrustedList.length) {
          return `${user['username']}, this user is not in the trusted users list.`;
        }
        if (checkTrustedList[0].status === 'active') {
          return `${user['username']}, this user is already set with that status.`;
        }
        if (checkTrustedList[0].status === 'inactive') {
          await utils.query(
            `
						UPDATE trusted_users
						SET status="active"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user status of ${msg[0]} to active`;
        }
      }

      if (msg[1] === 'inactive') {
        if (!checkTrustedList.length) {
          return `${user['username']}, this user is not in the trusted users list.`;
        }
        if (checkTrustedList[0].status === 'inactive') {
          return `${user['username']}, this user is already set with that status.`;
        }
        if (checkTrustedList[0].status === 'active') {
          await utils.query(
            `
						UPDATE trusted_users
						SET status="inactive"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user status of ${msg[0]} to inactive`;
        }
      }

      if (checkTrustedList.length != 0 && checkTrustedList[0].permissions === msg[1]) {
        return `${user['username']}, this permission is already assigned to that user.`;
      }

      switch (msg[1]) {
        case 'check':
        case 'status':
          if (!checkTrustedList.length) {
            return `${user['username']}, this user does not have any permissions assigned.`;
          }
          return `${user['username']}, permissions of that user: ${
            checkTrustedList[0].permissions
          }
					(${checkTrustedList[0].status}), added: ${utils.humanizeDuration(
            (Date.now() - Date.parse(checkTrustedList[0].added)) / 1000
          )} ago`;
        case '-1':
        case 'terraria':
          if (!checkTrustedList.length) {
            await utils.query(
              `
                            INSERT INTO trusted_users (username, permissions, status, added)
                            VALUES (?, "terraria", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
                        UPDATE trusted_users
                        SET permissions="terraria"
                        WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to terraria.`;

        case '1':
        case 'superuser':
          if (!checkTrustedList.length) {
            await utils.query(
              `
							INSERT INTO trusted_users (username, permissions, status, added)
							VALUES (?, "1:superuser", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
						UPDATE trusted_users
						SET permissions="1:superuser"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to superuser.`;

        case '2':
        case 'mod':
          if (!checkTrustedList.length) {
            await utils.query(
              `
							INSERT INTO trusted_users (username, permissions, status, added)
							VALUES (?, "2:mod", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
						UPDATE trusted_users
						SET permissions="2:mod"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to mod.`;

        case '3':
        case 'admin':
          if (!checkTrustedList.length) {
            await utils.query(
              `
							INSERT INTO trusted_users (username, permissions, status, added)
							VALUES (?, "3:admin", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
						UPDATE trusted_users
						SET permissions="3:admin"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to admin.`;

        case '4':
        case 'editor':
          if (!checkTrustedList.length) {
            await utils.query(
              `
							INSERT INTO trusted_users (username, permissions, status, added)
							VALUES (?, "4:editor", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
						UPDATE trusted_users
						SET permissions="4:editor"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to editor.`;

        case '5':
        case 'contributor':
          if (!checkTrustedList.length) {
            await utils.query(
              `
							INSERT INTO trusted_users (username, permissions, status, added)
							VALUES (?, "5:contributor", "active", CURRENT_TIMESTAMP)`,
              [msg[0]]
            );
          }
          await utils.query(
            `
						UPDATE trusted_users
						SET permissions="5:contributor"
						WHERE username=?`,
            [msg[0]]
          );
          return `${user['username']}, changed trusted user permissons for ${msg[0]} to contributor.`;

        default:
          return `${user['username']}, this permission type does not exist.`;
      }
      return `${user['username']}, [error] - eShrug something fucked up`;
    } catch (err) {
      utils.errorLog(err);
      bot.kb.whisper('kunszg', err);
    }
  },
};
