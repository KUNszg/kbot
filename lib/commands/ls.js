#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb rl",
    invocation: async (channel, user, message) => {
        try {
            const msg = custom.getParam(message.toLowerCase().replace(/@|,/g, ""));

            if (!msg[0]) {
                return `${user['username']}, you have to provide a user.`;
            }

            const checkIfOptedOut = await custom.query(`
                SELECT *
                FROM optout
                WHERE command=? AND username=?`,
                ["ls", msg[0]]);

           if (checkIfOptedOut.length && (user['username'] != msg[0])) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

            const userData = await custom.query(`
                SELECT *
                FROM user_list
                WHERE username=?`,
                [msg[0]]);

            if (!userData.length) {
                return `${user['username']}, this user does not exist in my logs.`;
            }

            if (userData[0].lastSeen === null) {
                return `${user['username']}, this user exists but has no last message saved.`;
            }

            const lastSeenDate = userData[0].lastSeen.split("*")[0];
            const time = (Math.abs(Date.now() - (Date.parse(lastSeenDate)))/1000);

            const lastSeenMessage = userData[0].lastSeen.split("*").splice(1).join("*");

            return `${user['username']}, this user's last message was logged ${custom.humanizeDuration(time)} ago and the message was: ${lastSeenMessage}`;
        } catch (err) {
            custom.errorLog(err)
            return ``;
        }
    }
}