#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: "kb hug",
	invocation: async (channel, user, message) => {
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

            const checkIfOptedOut = async () => {
                for (let i = 0; i < msg.length; i++) {
                    return await custom.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["hug", msg[i.toLowerCase().replace(/@|,/g, '')]]);
                }
            }

            if (await checkIfOptedOut().length) {
                return `${user['username']}, one of specified users has opted out from this command.`;
            }

			if (msg.length>1) {
                const formattedMessage = msg.reverse().join(', ').replace(', ', ' and ').split(',').reverse().join(', ');
				return (type[0] === "kiss") ?
                `${user['username']} kisses ${formattedMessage} FeelsGoodMan 💋` :
                `${user['username']} hugs ${formattedMessage} ${(channel === "#haxk") ? "forsenHug <3" : "FeelsGoodMan FBCatch"}`;
                return '';
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