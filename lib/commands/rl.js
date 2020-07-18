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
			const serverDate = new Date().getTime();

			if (!msg[0]) {
				const maxID = await custom.doQuery(
					'SELECT MAX(ID) AS number FROM logs_' + channel.replace('#', '')
					);

				// get random ID from the range of ID's in database
				const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;
				const randomLine = await custom.doQuery(`SELECT ID, username, message, date FROM
					logs_${channel.replace('#', '')} WHERE ID="${randNum}"`);
				if (!randomLine[0]) {
					return user['username'] + ", I don't have any logs from this channel :z";
				}

				function modifyOutput(modify) {
					return ` ago) ${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
					${randomLine[0].message.substr(0, modify)}`;

				}

				const timeDifference = (Math.abs(serverDate -
					(new Date(randomLine[0].date).getTime())))/1000/3600;
				const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

				// check for banphrases...
				if (await custom.banphrasePass(randomLine[0].message, channel.replace('#', '')).banned === true) {
					if (custom.strictChannels(channel)) {
						if (timeDifference>48) {
							kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' +
							 modifyOutput(1000));
						} else {
							kb.whisper(user['username'], '(' + custom.format(timeDifferenceRaw/1000) +
								modifyOutput(1000));
						}
						return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
					}

					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
					}
					return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
				}

				// check for channels
				if (channel === "#nymn" || channel === "#vadikus007") {
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
					}
					return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
				}

				// other channels
				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
				}
				return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);

			} else if (typeof msg[0] !== 'undefined' && msg[0] != '') {

				// check if user points to other channel
				const getChannel = msg.find(i=>i.startsWith('#'));
				if (typeof getChannel != 'undefined') {
					if (getChannel === '#supinic' || getChannel === "#haxk") {
						return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
					}
					// check if user exists in the database
					const checkChannel2 = await custom.doQuery(`SHOW TABLES LIKE "logs_${getChannel.replace('#', '')}"`)

					if (checkChannel2.length === 0) {
						return `${user['username']}, I'm not logging the channel you specified :/`;
					}
					const maxID = await custom.doQuery(
						'SELECT MAX(ID) AS number FROM logs_' + getChannel.replace('#', '')
						);
					const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;
					const randomLine = await custom.doQuery(`SELECT ID, username, message, date FROM
						logs_${getChannel.replace('#', '')} WHERE ID="${randNum}"`);
					if (!randomLine[0]) {
						return user['username'] + ", I don't have any logs from this channel :z";
					}

					const timeDifference = (Math.abs(serverDate -
						(new Date(randomLine[0].date).getTime())))/1000/3600;
					const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

					function modifyOutput(modify) {
						if (!modify) {
							return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' +
							randomLine[0].message.substr(0, 100);
						} else {
							return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' +
							randomLine[0].message.substr(0, modify);
						}
					}
					// check for banphrases...
					if (await custom.banphrasePass(randomLine[0].message, channel.replace('#', '')).banned === true) {
						if ((channel==="#nymn" || channel === "#forsen") || channel === "#vadikus007") {
							if (timeDifference>48) {
								kb.whisper(user['username'], getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + (timeDifference/24).toFixed(0) + 'd' +
									modifyOutput(1000));
							} else {
								kb.whisper(user['username'], getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + custom.format(timeDifferenceRaw/1000) +
									modifyOutput(1000));
							}
							return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
						}

						// other channels
						if (timeDifference>48) {
							return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
						}
						return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
					}

					// check for channels
					if (channel === "#nymn" || channel === "#vadikus007") {
						if (timeDifference>48) {
							return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
						}
						return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
					}

					// other channels
					if (timeDifference>48) {
						return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
					}
					return getChannel.replace(/^(.{2})/, "$1\u{E0000}") + ' (' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
				}
				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`SELECT * FROM user_list WHERE username="${msg[0]}"`);
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
					`)

				if (randomLine.length === 0) {
					return user['username'] + ', there are no logs in my database related to that user.';
				}
				const timeDifference = (Math.abs(serverDate -
					(new Date(randomLine[0].date).getTime())))/1000/3600;
				const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

				function modifyOutput(modify) {
					if (!modify) {
						return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' +
						randomLine[0].message.substr(0, 350);
					} else {
						return ' ago) ' + randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' +
						randomLine[0].message.substr(0, modify);
					}
				}
				// check for banphrases...
				if (await custom.banphrasePass(randomLine[0].message, channel.replace('#', '')).banned === true) {
					if (custom.strictChannels(channel)) {
						if (timeDifference>48) {
							kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(1000));
						} else {
							kb.whisper(user['username'], '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(1000));
						}
						return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
					}

					// other channels
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
					}
					return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
				}

				// check for channels
				if (channel === "#nymn" || channel === "#vadikus007") {
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
					}
					return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
				}

				// other channels
				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
				}
				return '(' + custom.format(timeDifferenceRaw/1000) + modifyOutput(100);
			}
		} catch (err) {
			custom.errorLog(err)
			return user['username'] + ' ' + err + ' FeelsDankMan !!!';
		}
	}
}