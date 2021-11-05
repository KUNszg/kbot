#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;

module.exports = {
    name: 'kb suggest',
    invocation: async (channel, user, message) => {
        try {
            const msg = utils.getParam(message);

            if (!msg[0]) {
                return `${user.username}, you have to provide a message along with this command.`;
            }

            if (msg[0] === "YOUR_CHANNEL_NAME") {
                return `${user.username}, it's a template text, type in your channel name instead you danker FeelsDankMan`;
            }

            const repeats = await kb.query(`
                SELECT *
                FROM suggestions
                WHERE status=? AND LOWER(message)=LOWER(?)`,
                ["new", msg[0].toLowerCase()]);

            if (repeats.length) {
                const findUser = await utils.Get.user().byUsername(msg[0].toLowerCase());

                if (findUser.length) {
                    return `${user.username}, this channel has already been requested, please wait until it gets processed.`;
                }
            }

            await kb.query(`
                INSERT INTO suggestions (username, message, created)
                VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [user.username, msg.join(' ')]);

            const suggestionID = (await kb.query(`
                SELECT ID
                FROM suggestions
                WHERE username=?
                ORDER BY created
                DESC`, [user.username]))[0].ID;

           if (msg[0] === user.username) {
               return `${user.username}, (ref ID #${suggestionID}) Thank you for requesting the bot for your channel. Your request will be processed within 1-3 days.`;
           }
           return `${user.username}, (ref ID #${suggestionID}) Thank you for your suggestion, it will be processed as soon as possible. State of progress will be whispered to you.`;
        } catch (err) {
            utils.errorLog(err)
            return `${user.username}, ${err} FeelsDankMan !!!`;
        }
    }
}