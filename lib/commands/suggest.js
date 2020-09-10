#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: 'kb suggest',
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

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