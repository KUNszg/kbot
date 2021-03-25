#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const database = require('../credentials/login.js').con;
const mysql = require('mysql2');

module.exports = {
	name: "kb query",
	invocation: async (channel, user, message) => {
		try {
			if (user['user-id'] != '178087241') {
				return '';
			}

			const query = (query, data = []) => new Promise((resolve, reject) => {
                database.execute(mysql.format(query, data), async(err, results, fields) => {
                    if (err) {
                        kb.whisper('kunszg', 'error');
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });

			const msg = utils.getParam(message);
			const msgJoined = msg.join(' ').toLowerCase()

			const queryResp = await query(`${msg.join(' ')}`);
			if ((msgJoined.includes('insert') || msgJoined.includes('update')) || msgJoined.includes('delete')) {
				return `${user['username']}, query completed, ${queryResp.info})`;
			}

			if (!msg.join(' ').includes('query')) {
				kb.whisper(user['username'], `forgot to add "As query" to the string FeelsDankMan !!!`);
			}

			return queryResp[0].query.toString()
		} catch (err) {
			utils.errorLog(err);
			kb.whisper('kunszg', err);
		}
	}
}