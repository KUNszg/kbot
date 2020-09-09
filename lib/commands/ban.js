#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

module.exports = {
    name: prefix + "ban",
    aliases: null,
    description: `ban a user`,
    permission: 3,
    invocation: async (channel, user, message, args) => {
        try {
            if (await custom.checkPermissions(user['username'])<3) {
                return '';
            }

            const msg = custom.getParam(message);
            const comment = custom.getParam(message, 3);

            const userid = await fetch(`https://api.ivr.fi/twitch/resolve/${msg[0]}`)
                .then(response => response.json());

            const checkRepeatedInsert = await custom.doQuery(`
                SELECT *
                FROM ban_list
                WHERE user_id="${userid.id}"
                `);

            if (checkRepeatedInsert.length != 0) {
                return `${user['username']}, user with ID ${userid.id} is already banned.`;
            }

            if (comment.length != 0) {
                if (!comment.join(' ').startsWith('//')) {
                    return `${user['username']}, syntax error, use // before comments.`;
                }

                // insert into the database to ban the user (if there is a comment)
                await custom.doQuery(`
                    INSERT INTO ban_list (username, user_id, comment, banned_by, date)
                    VALUES ("${msg[0]}", "${userid.id}", "${comment.join(' ').replace('//', '')}", "${user['username']}", CURRENT_TIMESTAMP)
                    `);

                return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;
            }

            // insert into the database to ban the user (if there is no comment)
            await custom.doQuery(`
                INSERT INTO ban_list (username, user_id, banned_by, date)
                VALUES ("${msg[0]}", "${userid.id}", "${user['username']}", CURRENT_TIMESTAMP)
                `);

            return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}