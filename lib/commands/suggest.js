#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: 'kb suggest',
	invocation: async (channel, user, message) => {
		try {
			const msg = custom.getParam(message);

			if (!msg[0]) {
				return `${user['username']}, you have to provide a message along with this command.`;
			}

            if (msg[0] === "YOUR_CHANNEL_NAME") {
                return `${user['username']}, it's a template text, type in your channel name instead you danker FeelsDankMan`;
            }

            await custom.query(`
                INSERT INTO suggestions (username, message, created)
                VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [user['username'], msg.join(' ')]);

	       const suggestionID = (await custom.query(`
                SELECT ID
                FROM suggestions
                WHERE message=?`,
                [msg.join(' ')]))[0].ID;

			return `${user['username']}, suggestion saved with ID ${suggestionID} PogChamp`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}