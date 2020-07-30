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
			const msg = custom.getParam(message);

			if (!msg[0]) {
				return `${user['username']}, you should provide a user to hug/kiss, 
					there is someone like that for sure FeelsOkayMan`;
			}

			if (msg[0] === user['username']) {
				return `${user['username']} hugs himself FeelsBadMan FBCatch`;
			}

			if (msg.length>7) {
				return `You can't hug more than 7 people due to corona monkaS`;
			}

			if (msg.length>1) {
				return `${user['username']}, group hug FeelsGoodMan FBCatch ${msg.join(', ')}`;
			}

			if (msg[0] === "hug") {
				if (channel === "#nymn") {
					return `${user['username']} hugs ${msg[0]} PeepoHappy FBCatch`;
				} 
				if (channel === "#haxk") {
					return `${user['username']} hugs ${msg[0]} forsenHug`;
				} 
				return `${user['username']} hugs ${msg[0]} 🤗 <3`;
			}

			if (channel === "#nymn") {
				return `${user['username']} kisses ${msg[0]} PeepoHappy 💋`;
			}
			return `${user['username']} kisses ${msg[0]} 😗 💋 `;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}	
	}
}