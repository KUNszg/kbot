#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
    name: "kb dank",
    invocation: async (channel, user, message, platform) => {
        try {
            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

            const msg = custom.getParam(message.toLowerCase());
            const type = custom.getParam(message.toLowerCase(), 1);

            if (!msg[0] || msg[0] === user['username']) {
                return `${user['username']}, FeelsDankMan oh zoinks, you just got flippin'
                danked by yourself FeelsDankMan FeelsDankMan FeelsDankMan`;
            }

            if (msg.length>5) {
                return `Danking more than 5 people is illegal < FeelsDankMan /`;
            }

            if (msg.length>1) {
                const formattedMessage = msg.reverse().join(', ').replace(', ', ' and ').split(',').reverse().join(', ');
                kb.say(channel, `${user['username']} oh zoinks ${formattedMessage} just got flippin' danked < FeelsDankMan /`);
                return '';
            }

            return `${user['username']}, you just danked ${msg[0]} FeelsDankMan 👍`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}