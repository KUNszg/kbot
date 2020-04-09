#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + 'rq',
	aliases: null,
	description: `Your random quote from the current chat -- cooldown 2s`,
	permission: 0,
	cooldown: 3000,
	invocation: async (channel, user, message, args) => {
		try {

			const serverDate = new Date().getTime();
			const checkChannel = await custom.doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, therefore I can't display 
				data for this command :/`;
			}

			const randomLine = await custom.doQuery(`
				SELECT t.*
				FROM logs_${channel.replace('#', '')} AS t
				INNER JOIN
				    (SELECT ROUND(
				       RAND() * 
				      (SELECT MAX(ID) FROM logs_nymn )) AS id
				     ) AS x
				WHERE
				    t.id >= x.id AND username="${user['username']}"
				LIMIT 1;
				`)

			if (!randomLine) {
				return `${user['username']}, I don't have any logs from this channel :z`;
			}

			function modifyOutput(modify) {
				if (!modify) {
					return ` ago) ${randomLine.username}: ${randomLine.message.substr(0, 350)}`;
				} else {
					return ` ago) ${randomLine.username}: ${randomLine.message.substr(0, modify)}`;
				}
			}

			const timeDifference = (Math.abs(serverDate - (new Date(randomLine.date).getTime())))/1000/3600;
			const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine.date).getTime())));

			// if the output is banphrased...
			if (await custom.banphrasePass(randomLine.message).banned === true) {
				if (channel==="#nymn") {
					if (timeDifference>48) {
						kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' +
						modifyOutput());
					} else {
						kb.whisper(user['username'], '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput());
					}
					return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
				}

				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
				}
				return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
			}
			
			// if output is fine...
			// make the messages more strict
			if (channel==="#nymn") {
				if (timeDifference>48) {
					return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
				}
				return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput(100);
			}

			// other channels
			if (timeDifference>48) {
				return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
			} 
			return '(' + custom.formatUptime(timeDifferenceRaw/1000) + modifyOutput();
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
