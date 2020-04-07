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

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(1)

			const msgRaw = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);

			if (!msgRaw[0]) {
				return `${user['username']}, you should provide a user to hug/kiss, 
					there is someone like that for sure FeelsOkayMan`;
			}

			if (msgRaw[0] === user['username']) {
				return `${user['username']} hugs himself FeelsBadMan FBCatch`;
			}

			if (msgRaw.length>7) {
				return `You can't hug more than 7 people due to corona monkaS`;
			}
			if (msgRaw.length>1) {
				return `${user['username']}, group hug FeelsGoodMan FBCatch ${msgRaw.join(', ')}`;
			}
			if (msg[0] === "hug") {
				if (channel === "#nymn") {
					return `${user['username']} hugs ${msgRaw[0]} PeepoHappy FBCatch`;
				} 
				if (channel === "#haxk") {
					return `${user['username']} hugs ${msgRaw[0]} forsenHug`;
				} 
				return `${user['username']} hugs ${msgRaw[0]} 🤗 <3`;
			}
			if (channel === "#nymn") {
				return `${user['username']} kisses ${msgRaw[0]} PeepoHappy 💋`;
			}
			return `${user['username']} kisses ${msgRaw[0]} 😗 💋 `;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}	
	}
}