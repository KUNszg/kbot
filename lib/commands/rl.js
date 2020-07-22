#!/usr/bin/env node
'use strict';

/* TODO:
 *	-refactor the code so its more universal
 * 	-make parameters pipeable not hardcodedz
 */
const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "rl",
	aliases: null,
	description: `kb rl [input] - random line from current chat, use input to get random line from a
	specified user, no input will return a random quote -- cooldown 2s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const checkChannel = await custom.doQuery(`
                SHOW TABLES LIKE "logs_${channel.replace('#', '')}"
                `);

			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel,
				therefore I can't display data for this command :/`;
			}

			const msg = custom.getParam(message);

            if (msg.includes("teodorv")) {
                return "FeelsBadMan";
            }

			if (!msg[0]) {
				const maxID = await custom.doQuery(
					'SELECT MAX(ID) AS number FROM logs_' + channel.replace('#', '')
					);

				// get random ID from the range of ID's in database
				const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

				const randomLine = await custom.doQuery(`
					SELECT ID, username, message, date 
					FROM logs_${channel.replace('#', '')} 
					WHERE ID="${randNum}"
					`);
				if (!randomLine[0]) {
					return `${user['username']}, I don't have any logs from this channel :z`;
				}

				const modifyOutput = (modify) => {
					return `${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
					${randomLine[0].message.substr(0, modify)}`;

				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

				return (timeDifference>172800) ? 
				`(${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(100)}` : 
				`(${custom.format(timeDifference)} ago) ${modifyOutput(100)}`;
			}

			if (typeof msg[0] !== 'undefined' && msg[0] != '') {

				// check if user points to other channel
				const getChannel = msg.find(i=>i.startsWith('#'));

				if (typeof getChannel != 'undefined') {
					if (getChannel === '#supinic' || getChannel === "#haxk") {
						return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
					}

					// check if user exists in the database
					const checkChannel2 = await custom.doQuery(`
						SHOW TABLES LIKE "logs_${getChannel.replace('#', '')}"
						`);

					if (checkChannel2.length === 0) {
						return `${user['username']}, I'm not logging the channel you specified :/`;
					}

					const maxID = await custom.doQuery(
						'SELECT MAX(ID) AS number FROM logs_' + getChannel.replace('#', '')
						);
					const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

					const randomLine = await custom.doQuery(`
						SELECT ID, username, message, date 
						FROM logs_${getChannel.replace('#', '')} WHERE ID="${randNum}"
						`);

					if (!randomLine[0]) {
						return user['username'] + ", I don't have any logs from this channel :z";
					}

					const modifyOutput = (modify) => {
						return `${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
						${randomLine[0].message.substr(0, modify)}`;
					}

					const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

					return getChannel + (timeDifference>172800) ? 
					` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(100)}` : 
					` (${custom.format(timeDifference)} ago) ${modifyOutput(100)}`;
				}

				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`
					SELECT * 
					FROM user_list 
					WHERE username="${msg[0]}"
					`);
				if (checkIfUserExists.length === 0) {
					return `${user['username']}, this user does not exist in my user list logs.`;
				}

				const randomLine = await custom.doQuery(`
					SELECT t.*
					FROM logs_${channel.replace('#', '')} AS t
					INNER JOIN
					    (SELECT ROUND(
					       RAND() *
					      (SELECT MAX(ID) FROM logs_${channel.replace('#', '')} )) AS id
					     ) AS x
					WHERE
					    t.id >= x.id AND username="${msg[0]}"
					LIMIT 1;
					`);

				if (randomLine.length === 0) {
					return `${user['username']}, there are no logs in my database related to that user.`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);				

				const modifyOutput = (modify) => {
					return `${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
					${randomLine[0].message.substr(0, modify)}`;
				}

				return (timeDifference>172800) ? 
				` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(100)}` : 
				` (${custom.format(timeDifference)} ago) ${modifyOutput(100)}`;
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}