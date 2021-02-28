#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb id",
	invocation: async (channel, user, message) => {
		try {
			const msg = custom.getParam(message);

			if (!msg[0]) {
				// get data about sender user from database
				const getSenderData = await custom.doQuery(`
					SELECT *
                    FROM user_list
					WHERE userId="${user['user-id']}"
					`);

				// check if user exists in user_list
				if (!getSenderData.length) {
					return `${user['username']}, you are not being logged in my database.`;
				}

				const dateDiff = Math.abs((new Date()) - (new Date(getSenderData[0].added)));
				const dateToSec = (dateDiff/1000).toFixed(0);

				return `${user['username']}, Your internal user ID is ${getSenderData[0].ID},
				you were first seen by the bot ${custom.humanizeDuration(dateToSec)} ago in channel
				${getSenderData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" :
				getSenderData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;
			}

            const checkIfOptedOut = await custom.query(`
                SELECT *
                FROM optout
                WHERE command=? AND username=?`,
                ["id", msg[0].toLowerCase().replace(/@|,/g, '')]);

            console.log(checkIfOptedOut.length && user['username'] != msg[0].toLowerCase().replace(/@|,/g, ''))
           if (checkIfOptedOut.length && user['username'] != msg[0].toLowerCase().replace(/@|,/g, '')) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

			// get of given user data if user was specified
			const getUserData = await custom.query(`
				SELECT *
                FROM user_list
				WHERE username=?`,
                [msg[0].toLowerCase().replace(/@|,/g, '')]);

			// check if user exists in user_list
			if (!getUserData.length) {
				return `${user['username']}, that user does not exist in my database.`;
			}

			const dateDiff = Math.abs((new Date()) - (new Date(getUserData[0].added)))
			const dateToSec = (dateDiff/1000).toFixed(0)

			return `${user['username']}, user ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")}
			has internal ID ${getUserData[0].ID} and was first seen by the bot ${custom.humanizeDuration(dateToSec)} ago
			in channel ${getUserData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" :
			getUserData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
