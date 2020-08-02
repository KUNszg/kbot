#!/usr/bin/env node
'use strict';

/* TODO:
 *	-refactor the code so its more universal
 * 	-make parameters pipeable not hardcoded
 */
const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + 'rq',
	aliases: null,
	description: `Your random quote from the current chat`,
	permission: 0,
	cooldown: 3000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			// check if user points to other channel
			let getChannel = msg.find(i=>i.startsWith('#'));

			if (typeof getChannel != 'undefined') {
				if (getChannel === '#supinic' || getChannel === "#haxk") {
					return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
				}

				// check if user exists in the database
				const checkChannel2 = await custom.doQuery(`SHOW TABLES LIKE "logs_${getChannel.replace('#', '')}"`)
				if (checkChannel2.length === 0) {
					return `${user['username']}, I'm not logging the channel you specified :/`;
				}

				const randomLine = await custom.doQuery(`
					SELECT t.*
					FROM logs_${getChannel.replace('#', '')} AS t
					INNER JOIN
					    (SELECT ROUND(
					       ${Math.random()} *
					      (SELECT MAX(ID) FROM logs_${getChannel.replace('#', '')} )) AS id
					     ) AS x
					WHERE
					    t.id >= x.id AND username="${user['username']}"
					LIMIT 1;
					`)

				if (randomLine.length === 0) {
					return `${user['username']}, I don't have any logs from this channel related to you :z`;
				}

				const modifyOutput = (modify) => {
					return `${randomLine[0].username}: ${randomLine[0].message.substr(0, modify)}`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

				getChannel = getChannel.replace(/^(.{2})/, "$1\u{E0000}");

				return (timeDifference>172800) ? 
				`${getChannel} (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` : 
				`${getChannel} (${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
			}

			const checkChannel = await custom.doQuery(`
				SHOW TABLES LIKE "logs_${channel.replace('#', '')}"
				`);
			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, therefore I can't display
				data for this command :/`;
			}

			const randomLine = await custom.doQuery(`
				SELECT t.*
				FROM logs_${channel.replace('#', '')} AS t
				INNER JOIN
				    (SELECT ROUND(
				       ${Math.random()}*
				      (SELECT MAX(ID) FROM logs_${channel.replace('#', '')} )) AS id
				     ) AS x
				WHERE
				    t.id >= x.id AND username="${user['username']}"
				LIMIT 1;
				`)

			if (randomLine.length === 0) {
				return `${user['username']}, I don't have any logs from this channel :z`;
			}

			const modifyOutput = (modify) => {
				return `${randomLine[0].username}: ${randomLine[0].message.substr(0, modify)}`;
			}

			const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

			return (timeDifference>172800) ? 
			` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` : 
			`(${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
			
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
