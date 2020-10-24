#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const database = require('../credentials/login.js').con

module.exports = {
	name: "kb query",
	invocation: async (channel, user, message) => {
		try {
			if (user['user-id'] != '178087241') {
				return '';
			}

			const query = (query) => new Promise((resolve, reject) => {
				database.query(query, (err, results, fields) => {
					if (err) {
						resolve(JSON.stringify(err))
					} else {
						kb.whisper(user['username'], JSON.stringify(fields))
						resolve(results);
					}
				});
			});

			const msg = custom.getParam(message);
			const msgJoined = msg.join(' ').toLowerCase()

			const queryResp = await query(`${msg.join(' ')}`);
			if ((msgJoined.includes('insert') ||
				msgJoined.includes('update')) ||
				msgJoined.includes('delete')) {
					return `${user['username']}, query completed :)`;
			}

			if (!msg.join(' ').includes('query')) {
				return `${user['username']}, forgot to add "As query" to the string FeelsDankMan !!!`;
			}

			return queryResp[0].query.toString();
		} catch (err) {
			custom.errorLog(err);
			kb.whisper('kunszg', err);
		}
	}
}