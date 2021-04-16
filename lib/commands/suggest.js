#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: 'kb suggest',
	invocation: async (channel, user, message) => {
		try {
			const msg = utils.getParam(message);

			if (!msg[0]) {
				return `${user['username']}, you have to provide a message along with this command.`;
			}

            if (msg[0] === "YOUR_CHANNEL_NAME") {
                return `${user['username']}, it's a template text, type in your channel name instead you danker FeelsDankMan`;
            }

            await utils.query(`
                INSERT INTO suggestions (username, message, created)
                VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [user['username'], msg.join(' ')]);

	       const suggestionID = (await utils.query(`
                SELECT ID
                FROM suggestions
                WHERE message=?`,
                [msg.join(' ')]))[0].ID;

			return `${user['username']}, suggestion saved with ID ${suggestionID} PogChamp`;
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}