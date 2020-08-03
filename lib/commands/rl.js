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
	specified user, no input will return a random quote`,
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
                return "FeelsBadMan <3";
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
				`(${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` :
				`(${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
			}

			if (typeof msg[0] !== 'undefined' && msg[0] != '') {

				// check if user points to other channel
				let getChannel = msg.find(i=>i.startsWith('#'));

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

					getChannel = getChannel.replace(/^(.{2})/, "$1\u{E0000}");

					return (timeDifference>172800) ?
					`${getChannel} (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` :
					`${getChannel} (${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
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

			    const getRows = await custom.doQuery(`
                    SELECT @min := MIN(id) as min, @max := MAX(id) as max
                    FROM logs_${channel.replace('#', '')};
                    `);
                const randomResults = await custom.doQuery(`
                    SELECT a.*
                    FROM logs_${channel.replace('#', '')} a
                    JOIN ( SELECT id FROM
                        ( SELECT id
                            FROM ( SELECT ${getRows[0].min} + (${getRows[0].max} - ${getRows[0].min} + 1 - 50) * RAND()
                            AS start FROM DUAL ) AS init
                            JOIN logs_${channel.replace('#', '')} y
                            WHERE    y.id > init.start AND username="${msg[0]}"
                            ORDER BY y.id
                            LIMIT 50
                        ) z ORDER BY RAND()
                        LIMIT 50
                    ) r ON a.id = r.id;
                    `);

                const randomRow = custom.random(randomResults);
                const randomLine = [];
                randomLine.push(randomRow);

				if (randomLine.length === 0) {
					return `${user['username']}, there are no logs in my database related to that user.`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

				const modifyOutput = (modify) => {
					return `${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
					${randomLine[0].message.substr(0, modify)}`;
				}

				return (timeDifference>172800) ?
				` (${custom.secondsToDhm(timeDifference)} ago) ${modifyOutput(440)}` :
				` (${custom.format(timeDifference)} ago) ${modifyOutput(440)}`;
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}