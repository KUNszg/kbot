#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

module.exports = {
	name: prefix + "unban",
	aliases: null,
	description: `unban a user`,
	permission: 3,
	cooldown: 10,
	invocation: async (channel, user, message, args) => {
		try {

			if (await custom.checkPermissions(user['username'])<3) { 
				return '';
			}

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);

			const comment = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(3)
				.filter(Boolean);

			const userid = await fetch(`https://api.ivr.fi/twitch/resolve/${msg[0]}`)
				.then(response => response.json());

			const checkRepeatedInsert = await custom.doQuery(`SELECT * FROM ban_list WHERE user_id="${userid.id}"`);

			if (checkRepeatedInsert.length === 0) {
				return `${user['username']}, no such user found in the database.`;
			}

			// delete the row with unbanned user
			await custom.doQuery(`DELETE FROM ban_list WHERE username="${msg[0].toLowerCase()}"`);

			// insert into a table to store previously banned users
			await custom.doQuery(`INSERT INTO unbanned_list (username, user_id, by, date) 
				VALUES ("${msg[0]}", "${userid.id}", "${user['username']}", CURRENT_TIMESTAMP)`)

			return `${user['username']}, user with ID ${userid.id} has been unbanned from the bot`;	
			
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}