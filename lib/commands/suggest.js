#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: prefix + 'suggest',
	aliases: null,
	description: `kb suggest [input] - suggest something for me to improve/change in my bot -- cooldown 8s`,
	permission: 0,
	cooldown: 8000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			if (!msg[0]) {
				return user['username'] + ', no message provided FeelsDankMan';
			}

			const checkRepeatedSql = 'SELECT message FROM suggestions WHERE message=?';							
			const checkRepeatedInsert = [msg.join(' ')];
			const query = await custom.doQuery(mysql.format(checkRepeatedSql, checkRepeatedInsert));

			if (!query[0]) {
				const sql = `
					INSERT INTO suggestions (username, message, created) 
					VALUES (?, ?, CURRENT_TIMESTAMP)
					`;

				const insert = [user['username'], msg.join(' ')];
				await custom.doQuery(mysql.format(sql, insert));

				const selectSql = `
					SELECT ID 
					FROM suggestions 
					WHERE message=?
					`;

				const selectInsert = [msg.join(' ')];
				const suggestionID = await custom.doQuery(mysql.format(selectSql, selectInsert));

				return `${user['username']}, suggestion saved with ID ${suggestionID[0].ID} PogChamp`;
			}
			return `${user['username']}, duplicate suggestion.`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}