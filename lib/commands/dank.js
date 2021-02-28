#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

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
                    return await custom.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["dank", msg[i.toLowerCase().replace(/@|,/g, '')]]);
                }
            }

            if (await checkIfOptedOut().length) {
                return `${user['username']}, one of specified users has opted out from this command.`;
            }

            if (msg.length>1) {
                const formattedMessage = msg.reverse().join(', ').replace(', ', ' and ').split(',').reverse().join(', ');
                return `${user['username']} oh zoinks ${formattedMessage} just got flippin' danked < FeelsDankMan /`;
            }

            return `${user['username']}, you just danked ${msg[0]} FeelsDankMan 👍`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}