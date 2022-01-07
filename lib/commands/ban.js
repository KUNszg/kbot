#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const got = require('got');

module.exports = {
    name: "kb ban",
    invocation: async (channel, user, message, platform) => {
        try {
            if (await utils.checkPermissions(user['username'])<3) {
                return '';
            }

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

            const msg = utils.getParam(message);
            const comment = utils.getParam(message, 3);

            const api = await utils.Get.api().url(message);
            const userid = await got(api + msg[0]).json();

            const checkRepeatedInsert = await utils.query(`
                SELECT *
                FROM ban_list
                WHERE user_id=?`,
                [userid.id]);

            if (checkRepeatedInsert.length != 0) {
                return `${user['username']}, user with ID ${userid.id} is already banned.`;
            }

            if (comment.length != 0) {
                if (!comment.join(' ').startsWith('//')) {
                    return `${user['username']}, syntax error, use // before comments.`;
                }

                // insert into the database to ban the user (if there is a comment)
                await utils.query(`
                    INSERT INTO ban_list (username, user_id, comment, banned_by, date)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [msg[0], userid.id, comment.join(' ').replace('//', ''), user['username']]);

                return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;
            }

            // insert into the database to ban the user (if there is no comment)
            await utils.query(`
                INSERT INTO ban_list (username, user_id, banned_by, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [msg[0], userid.id, user['username']]);

            return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}