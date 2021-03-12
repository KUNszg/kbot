#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb dank",
    invocation: async (channel, user, message) => {
        try {
            const msg = custom.getParam(message.toLowerCase());

            if (!msg[0] || msg[0] === user['username']) {
                return `${user['username']}, FeelsDankMan oh zoinks, you just got flippin'
                danked by yourself FeelsDankMan FeelsDankMan FeelsDankMan`;
            }

            if (msg.length>5) {
                return `Danking more than 5 people is illegal < FeelsDankMan /`;
            }

            const checkIfOptedOut = async () => {
                for (let i = 0; i < msg.length; i++) {
                    const findUser = await custom.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["stats", msg[i].toLowerCase().replace(/@|,/g, '')]);

                    if (findUser.length && (user['username'] != msg[i].toLowerCase().replace(/@|,/g, ''))) {
                        return findUser;
                        continue;
                    }
                }
            }
            if ((await checkIfOptedOut())?.length ?? false) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

            if (msg.length>1) {
                const formattedMessage = msg.reverse().join(', ').replace(', ', ' and ').split(',').reverse().join(', ');
                return `${user['username']} oh zoinks ${formattedMessage} just got flippin' danked < FeelsDankMan /`;
            }

            return `${user['username']}, you just danked ${msg[0].toLowerCase().replace(/@|,/g, '')} FeelsDankMan 👍`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}