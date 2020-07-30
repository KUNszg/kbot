#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');

module.exports = {
	name: prefix + "query",
	aliases: null,
	permission: 5,
	cooldown: 10,
	description: "MySQL query",
	invocation: async (channel, user, message, args) => {
		try {
			if (user['user-id'] != '178087241') {
				return '';
			}

			const msg = custom.getParam(message);

			const queryResp = await custom.doQuery(`${msg.join(' ')}`);
			if ((msg.join(' ').toLowerCase().includes('insert') || 
				msg.join(' ').toLowerCase().includes('update')) || 
				msg.join(' ').toLowerCase().includes('delete')) {
					return '';
				}
			
			if (!msg.join(' ').includes('query')) {
				return `${user['username']}, forgot to add "As query" to the string FeelsDankMan !!!`;
			} 

			return queryResp[0].query.toString(); 

		} catch (err) {
			custom.errorLog(err);
			bot.kb.whisper('kunszg', err);
		}
	}
}