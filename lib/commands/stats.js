#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const mysql = require('mysql2')

module.exports = {
	name: prefix + 'stats',
	aliases: null,
	description: `syntax: kb stats -channel / -bruh / [input] / @[user] | no parameter - information about your 
	logs in my database | -channel - information about the current channel | -bruh - amount of racists in the 
	chat | [input] - provide a custom message | @[user] - searches for given user -- cooldown 30s`,
	permission: 0,
	cooldown: 30000,
	invocation: async (channel, user, message, args) => {
		try {

			const msgRaw = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);
			const msg = msgRaw


			const channelParsed = channel.replace('#', '')
			const checkChannel = await custom.doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)

			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, 
				therefore I can't display stats for it :/`;
			}

			// if no parameters provided...
			if (((msg[0] != "-channel" && msg[0] != "-bruh") && msg.length != 0)) {	

				// kb stats @[user] [message]			
				if (msg.filter(i => i.startsWith('@')).toString().includes('@')) {

					// check if user exists in the database
					const checkIfUserExists = await custom.doQuery(`
						SELECT * FROM user_list 
						WHERE username="${msg.filter(i=>i.startsWith('@'))[0].replace('@', '')}"
						`);

					if (checkIfUserExists.length === 0) {
						return `${user['username']}, this user does not exist in my user list logs.`;
					}
					
					// check if user provided a user in flag
					if (msg.filter(i => i.startsWith('@'))[0].replace('@', '').length === 0) {
						return `${user['username']}, wrong flag syntax, no user after "@" provided`;
					}
					
					// check if user provided enough characters
					if (msg.filter(i => !i.startsWith('@')).join(' ').length<3) {
						return `${user['username']}, provided word has not enough characters to run a query.`;
					}
					
					// check if user provided any message to search for
					if (!msg.filter(i => !i.startsWith('@'))) {
						return `${user['username']}, no search query provided with the 
						given flag, eg.: kb stats @kunszg nam`;
					}
					
					// check for internal banphrases
					const getInternalBans = await custom.doQuery('SELECT * FROM internal_banphrases');
					const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase))
					if (checkIfBanned.length != 0 && channel === "#nymn") {
						return `${user['username']}, I cannot search with this query, 
						it contains an internally banned phrase.`;
					}
					
					// get the message
					const sql = `
						SELECT t.*
						FROM logs_${channelParsed} AS t
						INNER JOIN
						    (SELECT ROUND(
						       RAND() * 
						      (SELECT MAX(ID) FROM logs_${channelParsed} )) AS id
						     ) AS x
						WHERE
						    t.id >= x.id AND message LIKE ? AND username=?
						LIMIT 1;
						`;

					const inserts = [
						'%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%', 
						msg.filter(i => i.startsWith('@'))[0].replace('@', '')
						];
					
					// get the occurence
					const sql2 = `
						SELECT message, COUNT(message) AS value_occurance 
						FROM logs_${channelParsed} 
						WHERE username=? AND message LIKE ? 
						GROUP BY message 
						ORDER BY value_occurance 
						DESC 
						LIMIT 1;
						`;

					const inserts2 = [
						msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
						'%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
						];

					const compile = await Promise.all([
						custom.doQuery(mysql.format(sql, inserts)), 
						custom.doQuery(mysql.format(sql2, inserts2))
						]);
					
					// check if there are any logs for specified user
					if (compile[0].length === 0) {
						return `${user['username']}, no message logs found for that query 
						or related to that user.`;
					}

					function modifyOutput(modify) {
						if (!modify) {
							return `${user['username']}, messages similar to 
							" ${compile[0][0].message.substr(0, 255)} " have been typed 
							${compile[1][0].value_occurance} times in this channel by user 
							${compile[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
						} else {
							return `${user['username']}, messages similar to 
							" ${compile[0][0].message.substr(0, modify)} " have been typed
							 ${compile[1][0].value_occurance} times in this channel by user 
							 ${compile[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
						}
					}

					if (channel === '#nymn') {

						// check for banned phrases
						const getInternalBans = await custom.doQuery('SELECT * FROM internal_banphrases');
						const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase))
						if (checkIfBanned.length != 0) {
							return `${user['username']}, I cannot search with this query, 
							it contains an internally banned phrase.`;
						}
					
						if (compile[0][0].message.toString().length>50) {
						
							// check if response would cause timeout in the channel
							if (await custom.banphrasePass(modifyOutput()).banned === true) {
								bot.kb.whisper(`${user['username']}, ${modifyOutput()}`);
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							}
							return modifyOutput(50);
						}
					
						// less than 50 characters
						if (await custom.banphrasePass(modifyOutput()).banned === true) {
							bot.kb.whisper(user['username'], modifyOutput());
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						} 
						return modifyOutput(50);
					}
					if (compile[0][0].message.toString().length>255) {
				
						// check if response would cause timeout in the channel
						if (await custom.banphrasePass(modifyOutput()).banned === true) {
							bot.kb.whisper(`${user['username']}, ${modifyOutput()}`);
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						}
						return modifyOutput();
					}
		
					// less than 500 characters
					if (await custom.banphrasePass(modifyOutput()).banned === true) {
						bot.kb.whisper(user['username'], modifyOutput());
						return `${user['username']}, the result is banphrased, 
						I whispered it to you tho cmonBruh`;
					} 
					return modifyOutput();

				// kb stats [message]
				} else {

					// check if query has enough characters
					if (msg.join(' ').length<3) {
						return `${user['username']}, provided word has not enough characters to run a query.`;
					} 

					// positional query
					const sql = `
						SELECT message FROM ?? 
						WHERE MATCH(message) AGAINST (?) 
						ORDER BY RAND() 
						LIMIT 1;
						`;

					const inserts = [`logs_${channelParsed}`, `'"*${msg.join(' ')}*"'`]
					const sql2 = `
						SELECT count(*) AS value_occurance 
						FROM ?? 
						WHERE MATCH(message) AGAINST (?);
						`;

					const inserts2 = [`logs_${channelParsed}`, `'"*${msg.join(' ')}*"'`]
					const occurence = await Promise.all([
						custom.doQuery(mysql.format(sql, inserts)), 
						custom.doQuery(mysql.format(sql2, inserts2))
						])

					// check if there are any message logs for given query
					if (occurence[0].length === 0) {
						return `${user['username']}, no message logs found for that query`;
					}

					function modifyOutput(modify) {
						if (!modify) {
							return `${user['username']}, messages similar to 
							" ${occurence[0][0].message.substr(0, 255)} " have been typed 
							${occurence[1][0].value_occurance} times in this channel.`;
						} else {
							return `${user['username']}, messages similar to 
							" ${occurence[0][0].message.substr(0, modify)} " have been typed 
							${occurence[1][0].value_occurance} times in this channel.`;
						}
					}

					if (channel === '#nymn') {

						// check for banphrases
						const getInternalBans = await custom.doQuery(`
							SELECT * 
							FROM internal_banphrases
							`);

						const checkIfBanned = getInternalBans
							.filter(i => msg.join(' ')
							.includes(i.banphrase))

						if (checkIfBanned.length != 0) {
							return `${user['username']}, I cannot search with this query, 
							it contains an internally banned phrase.`;
						}
						// check if response exceeds 500 characters limit
						if (occurence[0][0].message.toString().length>50) {
							// check if response would cause timeout in the channel
							if (await custom.banphrasePass(modifyOutput()).banned === true) {
								bot.kb.whisper(user['username'], modifyOutput());
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							}
							return modifyOutput(50);
						}
						if (await custom.banphrasePass(modifyOutput()).banned === true) {
							bot.kb.whisper(user['username'], modifyOutput());
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						}
						return modifyOutput(50);
					}
					// check if response exceeds 500 characters limit
					if (occurence[0][0].message.toString().length>500) {
						// check if response would cause timeout in the channel
						if (await custom.banphrasePass(modifyOutput()).banned === true) {
							bot.kb.whisper(user['username'], modifyOutput());
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						}
						return modifyOutput();
					}
					if (await custom.banphrasePass(modifyOutput()).banned === true) {
						bot.kb.whisper(user['username'], modifyOutput());
						return `${user['username']}, the result is banphrased, 
						I whispered it to you tho cmonBruh`;
					}
					return modifyOutput();
				}
			} else if (msg[0] === "-channel") {

				if (msg[1]) {
					const checkChannels = await custom.doQuery(`SELECT * FROM channels_logger WHERE channel="${msg[1].replace('#', '')}"`)
					if (checkChannels.length === 0) {
						return `${user['username']}, I don't have any logs from that channel :P`;
					}

					const otherChannels = await Promise.all([
				
						// amount of rows
						custom.doQuery(`
							SELECT MAX(ID) AS value 
							FROM logs_${msg[1].replace('#', '')}
							`),
					 	
						// table size
					 	custom.doQuery(`
					 		SELECT TABLE_NAME 
					 			AS ` + '`' + 'Table' + '`' + `, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 
								AS size FROM information_schema.TABLES 
							WHERE TABLE_NAME = "logs_${msg[1].replace('#', '')}" 
							ORDER BY (DATA_LENGTH + INDEX_LENGTH) 
							DESC;
							`),

					 	// create time
					 	custom.doQuery(`
					 		SELECT date AS create_time 
					 		FROM logs_${msg[1].replace('#', '')} 
					 		LIMIT 1
					 		OFFSET 0
					 		`) 
		 			]);
		 			// date formatting
					const logsDate = new Date(otherChannels[2][0].create_time);
					const serverDate = new Date();
					const difference = Math.abs(serverDate - logsDate);
					const differenceToSec = difference/1000;

					return `${user['username']}, channel ${msg[1].replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")} 
					has ${otherChannels[0][0].value} lines logged, which is ${Number(otherChannels[1][0].size).toFixed(0)} MB total. 
					Logs in that channel started ${(differenceToSec/86400).toFixed(0)} days ago.`;
				}

				const values = await Promise.all([
				
					// amount of rows
					custom.doQuery(`
						SELECT MAX(ID) AS value 
						FROM logs_${channelParsed}
						`),
				 	
					// table size
				 	custom.doQuery(`
				 		SELECT TABLE_NAME 
				 			AS ` + '`' + 'Table' + '`' + `, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 
							AS size FROM information_schema.TABLES 
						WHERE TABLE_NAME = "logs_${channelParsed}" 
						ORDER BY (DATA_LENGTH + INDEX_LENGTH) 
						DESC;
						`),

				 	// create time
				 	custom.doQuery(`
				 		SELECT date AS create_time 
				 		FROM logs_${channelParsed} 
				 		LIMIT 1
				 		OFFSET 0
				 		`) 
			 	])

				// date formatting
				const logsDate = new Date(values[2][0].create_time);
				const serverDate = new Date();
				const difference = Math.abs(serverDate - logsDate);
				const differenceToSec = difference/1000;

				return `${user['username']}, this channel has ${values[0][0].value}
				lines logged, which is ${Number(values[1][0].size).toFixed(0)} MB total. 
				Logs in this channel started ${(differenceToSec/86400).toFixed(0)} days ago.`;
			} else if (msg[0] === "-bruh") {

				// kb stats -bruh
				if (!msg[1]) {

					// count the words in the channel
					const channelValue = await custom.doQuery(`
						SELECT COUNT(*) AS valueCount 
						FROM logs_${channelParsed} 
						WHERE message LIKE "%nigg%"
						`);

					// count the words in the channel for sender
					const userValue = await custom.doQuery(`
						SELECT COUNT(*) AS value 
						FROM logs_${channelParsed} 
						WHERE (message LIKE "%nigg%") AND username="${user['username']}"
						`);

					// channel specific responses
					if (channel === '#haxk') {
						if (userValue[0].value<2 && userValue[0].value != 1) {
							return `${user['username']}, you have spelled it ${userValue[0].value} times, 
							we coo TriHard - total of ${channelValue[0].valueCount} n bombs in this channel 
							TriChomp TeaTime`;
						} 
						if (userValue[0].value===1) {
							return `${user['username']}, you have spelled it ${userValue[0].value} time 
							WideHard - total of ${channelValue[0].valueCount} n bombs in this channel 
							TriChomp TeaTime`;
						}
						return `${user['username']}, you have spelled it ${userValue[0].value} 
						times TriChomp Clap - total of ${channelValue[0].valueCount} n bombs in this channel 
						TriChomp TeaTime`;
					} else {
						if (channelValue[0].valueCount === 0) {
							return `${user['username']}, total of ${channelValue[0].valueCount} racists 
							in this channel, we coo TriHard Clap`;
						}
						return `${user['username']}, total of ${channelValue[0].valueCount} racists 
						in this channel cmonBruh`;
					}

				// kb stats -bruh [user]
				} else {

					// check if user exists in the database
					const checkIfUserExists = await custom.doQuery(`
						SELECT * FROM user_list 
						WHERE username="${msg[1]}"
						`);

					// check if channel exists in user_list logs
					if (checkIfUserExists.length === 0) {
						return `${user['username']}, this user does not exist in my user list logs.`;
					}

					const channelValue = await custom.doQuery(`
						SELECT COUNT(*) AS valueCount 
						FROM logs_${channelParsed} 
						WHERE username="${msg[1]}" AND (message LIKE "%nigg%")
						`);

					const userValue = await custom.doQuery(`
						SELECT COUNT(*) AS value 
						FROM logs_${channelParsed} 
						WHERE (message LIKE "%nigg%") AND username="${msg[1]}"
						`);

					if (msg[1].toLowerCase() === 'teodorv') {
						return `${user['username']}, that user has opted out from this command.`; 
					}
					
					// replace second character in user's name with an invisible character to prevent the ping
					const userNoPing = msg[1].replace(/^(.{2})/, "$1\u{E0000}");

					if (channel === '#haxk') {
						if (userValue[0].value<2 && userValue[0].value != 1) {
							return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
							times, we coo TriHard`;
						}  
						if (userValue[0].value===1){
							return` ${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
							time WideHard`;
						}
						return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
						times TriChomp Clap`;
					} 
					
					if (channelValue[0].valueCount === 0) {
						return `${user['username']} total of ${channelValue[0].valueCount} racist activities 
						by user ${userNoPing} we coo TriHard Clap`;
					}
					return `${user['username']} total of ${channelValue[0].valueCount} racist activities 
					by user ${userNoPing} in this channel cmonBruh bruh`
				}

			// kb stats
			} else {

				// get amout lines of sender user in the current channel
				const values = await custom.doQuery(`
					SELECT COUNT(username) as value 
					FROM logs_${channelParsed} 
					WHERE username="${user['username']}"
					`)

				// all lines in the channel
				const occurence = await	 custom.doQuery(`
					SELECT COUNT(username) as value 
					FROM logs_${channelParsed}
					`)

				// channel lines occurence
				const val = await custom.doQuery(`
					SELECT message, COUNT(message) AS value_occurance 
					FROM logs_${channelParsed} 
					WHERE username="${user['username']}" AND (
						message NOT LIKE "?%" 
						AND message NOT LIKE "+%" 
						AND message NOT LIKE "kb%" 
						AND message NOT LIKE "$%" 
						AND message NOT LIKE "!%" 
						AND message NOT LIKE "&%" 
						AND message NOT LIKE "-%"
						) 
					GROUP BY message 
					ORDER BY value_occurance 
					DESC 
					LIMIT 1;
					`)

				// manage the output message lengths
				function modifyOutput(modify) {
					if (!modify) {
						return `${user['username']}, you have total of ${values[0].value} lines logged, 
						that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}% 
						of all lines in this channel, your most frequently typed message: " 
						${val[0].message.substr(0, 255)} " (${val[0].value_occurance} times)`;
					} else {
						return `${user['username']}, you have total of ${values[0].value} lines logged, 
						that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}% 
						of all lines in this channel, your most frequently typed message: " 
						${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
					}
				}
				if (channel === "#nymn") {
					// if response has more than 100 characters, truncate it	
					if (val[0].message.toString().length>100) {
						if (await custom.banphrasePass(modifyOutput()).banned === true) {
							bot.kb.whisper(user['username'], modifyOutput());
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						}
						return modifyOutput(100);
					}
					if (await custom.banphrasePass(modifyOutput()).banned === true) {
						bot.kb.whisper(user['username'], modifyOutput());
						return `${user['username']}, the result is banphrased, 
						I whispered it to you tho cmonBruh`;
					}
					return modifyOutput(100);
				}
				// if response has more than 300 characters, truncate it	
				if (val[0].message.toString().length>300) {
					if (await custom.banphrasePass(modifyOutput()).banned === true) {
						bot.kb.whisper(user['username'], modifyOutput());
						return `${user['username']}, the result is banphrased, 
						I whispered it to you tho cmonBruh`;
					}
					return modifyOutput(300);
				}
					
				if (await custom.banphrasePass(modifyOutput()).banned === true) {
					bot.kb.whisper(user['username'], modifyOutput());
					return `${user['username']}, the result is banphrased, 
					I whispered it to you tho cmonBruh`;
				}
				return modifyOutput(300);
			}	

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}