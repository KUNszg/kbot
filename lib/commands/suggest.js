#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: 'kb suggest',
	invocation: async (channel, user, message, platform) => {
		try {
            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

			const msg = custom.getParam(message);

			if (!msg[0]) {
				return user['username'] + ', please provide a message along with this command, thank you :)';
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

				return `${user['username']}, suggestion saved with ID ${suggestionID[0].ID} KomodoHype`;
			}
			return `${user['username']}, duplicate suggestion.`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}