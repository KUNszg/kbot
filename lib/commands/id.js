#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "id",
	aliases: prefix + "ID",
	description: `usage: kb id [user] | user - provide a user to see his ID and first seen timestamp | 
	no parameter - shows your ID and first seen timestamp`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {	
		try {
			const msg = custom.getParam(message);
			
			if (!msg[0]) {
				// get data about sender user from database
				const getSenderData = await custom.doQuery(`
					SELECT * FROM user_list 
					WHERE userId="${user['user-id']}"
					`);

				// check if user exists in user_list
				if (getSenderData.length === 0) {
					return `${user['username']}, you are not being logged in my database.`;
				}

				const dateDiff = Math.abs((new Date()) - (new Date(getSenderData[0].added))) 
				const dateToSec = (dateDiff/1000).toFixed(0)

				// if user was seen more than 4 days ago
				if (dateToSec>259200) {
					return `${user['username']}, Your internal user ID is ${getSenderData[0].ID}, 
					you were first seen by the bot ${((dateToSec/3600).toFixed(0)/24).toFixed(0)} days ago 
					in channel ${getSenderData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" : 
					getSenderData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;
				}

				// if user was seen less than 4 days ago
				return `${user['username']}, Your internal user ID is ${getSenderData[0].ID},
				you were first seen by the bot ${custom.format(dateToSec)} ago in channel 
				${getSenderData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" : 
				getSenderData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;
			}

			// get of given user data if user was specified
			const getUserData = await custom.doQuery(`
				SELECT * FROM user_list 
				WHERE username="${msg[0]}"
				`);

			// check if user exists in user_list
			if (getUserData.length === 0) {
				return `${user['username']}, that user does not exist in my database.`;
			}

			const dateDiff2 = Math.abs((new Date()) - (new Date(getUserData[0].added)))
			const dateToSec2 = (dateDiff2/1000).toFixed(0)

			// if user was seen more than 4 days ago
			if (dateToSec2>259200) {
				return `${user['username']}, user ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")} 
				has internal ID ${getUserData[0].ID} and was first seen by the bot 
				${((dateToSec2/3600).toFixed(0)/24).toFixed(0)} days ago in channel 
				${getUserData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" : 
				getUserData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;
			}

			// if user was seen less than 4 days ago
			return `${user['username']}, user ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")} 
			has internal ID ${getUserData[0].ID} and was first seen by the bot ${custom.format(dateToSec2)} ago
			in channel ${getUserData[0].channel_first_appeared === "haxk" ? "[EXPUNGED]" : 
			getUserData[0].channel_first_appeared.replace(/^(.{2})/, "$1\u{E0000}")}.`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
