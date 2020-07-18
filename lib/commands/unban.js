#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

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

			const msg = custom.getParam(message);
			const comment = custom.getParam(message, 3);

			const got = require('got');
			const userid = await got(`https://api.ivr.fi/twitch/resolve/${msg[0]}`).json();

			const checkRepeatedInsert = await custom.doQuery(`SELECT * FROM ban_list WHERE user_id="${userid.id}"`);

			if (checkRepeatedInsert.length === 0) {
				return `${user['username']}, no such user found in the database.`;
			}

			// delete the row with unbanned user
			await custom.doQuery(`DELETE FROM ban_list WHERE username="${msg[0].toLowerCase()}"`);

			// insert into a table to store previously banned users
			await custom.doQuery(`INSERT INTO unbanned_list (username, user_id, unbanned_by, date) 
				VALUES ("${msg[0]}", "${userid.id}", "${user['username']}", CURRENT_TIMESTAMP)`)

			return `${user['username']}, user with ID ${userid.id} has been unbanned from the bot`;	
			
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}