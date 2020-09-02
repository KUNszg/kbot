#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "hug",
	aliases: null,
	description: "kb [hug/kiss] [user] - hug or kiss a user to make their day better :) -- cooldown 5s",
	permission: 0,
	cooldown: 10000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message.toLowerCase());
            const type = custom.getParam(message.toLowerCase(), 1);

			if (!msg[0]) {
				return `${user['username']}, you should provide a user to hug/kiss,
					there is someone like that for sure FeelsOkayMan`;
			}

			if (msg[0] === user['username']) {
				return (type[0] === "kiss") ?
                `${user['username']} kisses himself FeelsBadMan 💋` :
                `${user['username']} hugs himself FeelsBadMan FBCatch`;
			}

			if (msg.length>5) {
				return (type[0] === "kiss") ?
                `You can't kiss more than 5 people monkaS` :
                `You can't hug more than 5 people monkaS`;
			}

			if (msg.length>1) {
                const formattedMessage = msg.reverse().join(', ').replace(', ', ' and ').split(',').reverse().join(', ');
				return (type[0] === "kiss") ?
                `${user['username']} kisses ${formattedMessage} FeelsGoodMan 💋` :
                `${user['username']} hugs ${formattedMessage} ${(channel === "#haxk") ? "forsenHug <3" : "FeelsGoodMan FBCatch"}`;
			}

			if (type[0] === "hug") {
				if (channel === "#nymn") {
					return `${user['username']} hugs ${msg[0]} peepoHappy FBCatch`;
				}
				if (channel === "#haxk") {
					return `${user['username']} hugs ${msg[0]} forsenHug`;
				}
				return `${user['username']} hugs ${msg[0]} 🤗 <3`;
			}

            if (type[0] === "kiss") {
    			if (channel === "#nymn") {
    				return `${user['username']} kisses ${msg[0]} peepoHappy 💋`;
    			}
    			return `${user['username']} kisses ${msg[0]} 😗 💋 `;
            }
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}