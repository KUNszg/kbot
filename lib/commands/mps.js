#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const data = require('../static/message_stats.js');
const bot = require('../handler.js');

module.exports = {
	name: prefix + 'mps',
	aliases: null,
	description: `messages per second and per minute for current channel -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);

			if (!msg[0]) {
				const cache = data.cache.filter(i=>i.channel===channel.replace('#', ''));
				if (typeof cache === 'undefined' || cache.length === 0) {
					bot.kb.say(channel, `${user['username']}, this channel has not enough messages 
						per minute to display statistics.`);
					return '';
				}
				bot.kb.say(channel, `${user['username']}, this channel has currently ${(cache.length/60).toFixed(2)} 
					messages per second or ${cache.length} messages per minute.`);
			}
			return '';

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}