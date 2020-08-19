#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const mysql = require('mysql2');

// allow only one execution at the same time (globally)
const stallTheCommand = new Set();

module.exports = {
    stall: stallTheCommand,
	name: prefix + 'stats',
	aliases: null,
	description: `syntax: https://pastebin.com/jiwLEBn9`,
    description_formatted: 'syntax: pastebin (dot) com/jiwLEBn9',
	permission: 0,
	cooldown: 60000,
	invocation: async (channel, user, message, args) => {
		try {
            if (stallTheCommand.has('busy')) {
                return '';
            }
            stallTheCommand.add('busy');
            setTimeout(()=>{
                stallTheCommand.clear();
            }, 60000);

            const msg = custom.getParam(message.replace(/[^-?]\bcolor\b/, 'stats -color'));

			// check for internal banphrases
			const getInternalBans = await custom.doQuery(`
				SELECT *
				FROM internal_banphrases
				`);

			const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase));

			if (checkIfBanned.length != 0 && custom.strictChannels(channel)) {
				return `${user['username']}, I cannot search with this query,
				it contains an internally banned phrase.`;
			}

			const channelParsed = channel.replace('#', '')
			const checkChannel = await custom.doQuery(`
				SHOW TABLES LIKE "logs_${channelParsed}"
				`);

			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel,
				therefore I can't display stats for it :/`;
			}

			/* kb stats */
			const stats = async() => {
				if (channel === "#forsen") {
					kb.whisper(user['username'], 'this syntax is disabled in this channel, you can still use kb stats [message] or kb stats -bruh etc.');
					return '';
				}

				// all lines in the channel
				const occurence = await	 custom.doQuery(`
					SELECT MAX(ID) as value
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
				async function modifyOutput(modify) {
                    if (channel==="#nymn") {
                        return `${user['username']}, your most frequently typed message: "
                        ${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
                    }

                    const values = await custom.doQuery(`
                        SELECT COUNT(username) as value
                        FROM logs_${channelParsed}
                        WHERE username="${user['username']}"
                        `);

					if (Number(val[0].value_occurance) <= 3) {
						return `${user['username']}, you have total of ${values[0].value} lines logged,
                        that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                        of all lines in this channel.`;
					}

					return `${user['username']}, you have total of ${values[0].value} lines logged,
                    that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                    of all lines in this channel, your most frequently typed message: "
                    ${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
				}

				if (custom.strictChannels(channel)) {
					return modifyOutput(100);
				}
				return modifyOutput(250);
			}

			/* kb stats @[user] [message] */
			const statsUser =  async() => {
				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`
					SELECT * FROM user_list
					WHERE username="${msg.filter(i=>i.startsWith('@'))[0].replace('@', '').replace(',', '')}"
					`);

				if (checkIfUserExists.length === 0) {
					return `${user['username']}, this user does not exist in my user list logs.`;
				}

				// check if user provided a user in flag
				if (msg.filter(i => i.startsWith('@'))[0].replace('@', '').replace(',', '').length === 0) {
					return `${user['username']}, wrong flag syntax, no user after "@" provided`;
				}

				// check if user provided enough characters
				if (msg.filter(i => !i.startsWith('@')).join(' ').length<3) {
					if (msg.filter(i => !i.startsWith('@')).join(' ').length===0) {
						return `${user['username']}, you did not provide any phrase.
						(usage example: kb stats @kunszg hello)`;
					}
					return `${user['username']}, provided word has not enough characters to run a query.`;
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
					    t.id >= x.id AND username=? AND message LIKE ?
					LIMIT 1`;
				const select = [
					msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
					'%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
					];

				// get the occurence
				const sql2 = `
					SELECT username, message, COUNT(*) AS value
                    FROM logs_${channelParsed}
                    WHERE username=? AND message LIKE ?`;
				const select2 = [
					msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
					'%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
					];

				const response = await Promise.all([
					custom.doQuery(mysql.format(sql, select)),
					custom.doQuery(mysql.format(sql2, select2))
					]);

				// check if there are any logs for specified user
				if (response[0].length === 0 || Number(response[0].value) === 0) {
					return `${user['username']}, no message logs found for that query
					or related to that user.`;
				}
                console.log(response)
				// limit message length
				function modifyOutput(modify) {
					return `${user['username']}, messages similar to
					" ${response[0][0].message.substr(0, modify)} " have been typed
					 ${response[1][0].value} times in this channel by user
					 ${response[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
				}

				// for channels marked as strict
				if (custom.strictChannels(channel)) {
					return modifyOutput(50);
				}
				return modifyOutput(250);
			}

			/* kb stats [message] */
			const statsMessage = async() => {
				if (!msg) {
					kb.whisper('kunszg', message)
					return `${user['username']}, internal error has occured monkaS @kunszg [#err_statsMessage]`;
				}

				// check if query has enough characters
				if (msg.join(' ').length<3) {
					return `${user['username']}, provided word has not enough characters to run a query.`;
				}

				// positional query
				const sql = `
					SELECT t.message
					FROM logs_${channelParsed} AS t
					INNER JOIN
					    (SELECT ROUND(
					       RAND() *
					      (SELECT MAX(ID) FROM logs_${channelParsed} )) AS id
					     ) AS x
					WHERE
					    t.id >= x.id AND MATCH(message) AGAINST (?)
					ORDER BY RAND() LIMIT 1
					`;
				const inserts = [`'"*${msg.join(' ')}*"'`];

				const sql2 = `
					SELECT count(*) AS value_occurance
					FROM logs_${channelParsed}
					WHERE MATCH(message) AGAINST (?);
					`;
				const inserts2 = [`'"*${msg.join(' ')}*"'`];

				const occurence = await Promise.all([
					custom.doQuery(mysql.format(sql, inserts)),
					custom.doQuery(mysql.format(sql2, inserts2))
					])

				// check if there are any message logs for given query
				if (occurence[0].length === 0) {
					return `${user['username']}, no message logs found for that query`;
				}

				function modifyOutput(modify) {
					return `${user['username']}, messages similar to
					" ${occurence[0][0].message.substr(0, modify)} " have been typed
					${occurence[1][0].value_occurance} times in this channel.`;
				}

				if (custom.strictChannels(channel)) {
					return modifyOutput(75);
				}
				return modifyOutput(250);
			}

			/* kb stats -channel */
			const statsChannel = async() => {
				if (msg[1]) {
					const checkChannels = await custom.doQuery(`
						SELECT *
						FROM channels_logger
						WHERE channel="${msg[1].replace('#', '')}"
						`);

					if (checkChannels.length === 0) {
						return `${user['username']}, I don't have any logs from that channel :P`;
					}

					const channelData = await Promise.all([
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
					const logsDate = new Date(channelData[2][0].create_time);
					const date = Math.abs(new Date() - logsDate)/1000;

					return `${user['username']}, channel ${msg[1].replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")}
					has ${channelData[0][0].value} lines logged, which is ${Number(channelData[1][0].size).toFixed(0)} MB total.
					Logs in that channel started ${(date/86400).toFixed(0)} days ago.`;
				}

				const channelData = await Promise.all([
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
				const logsDate = new Date(channelData[2][0].create_time);
				const date = Math.abs(new Date() - logsDate)/1000;

				return `${user['username']}, this channel has ${channelData[0][0].value}
				lines logged, which is ${Number(channelData[1][0].size).toFixed(0)} MB total.
				Logs in this channel started ${(date/86400).toFixed(0)} days ago.`;
			}

			/* kb stats -bruh */
			const statsBruh = async() => {
				if (channel==="#vadikus007") {
					return `${user['username']}, this command flag is no longer available in this channel :(`;
				}

				// kb stats -bruh
				if (!msg[1]) {
					// channel specific responses
					if (channel === '#haxk') {
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
						if (userValue[0].value<2 && userValue[0].value != 1) {
							return `${user['username']}, you have spelled it ${userValue[0].value} times,
							we coo TriHard - total of ${channelValue[0].valueCount} n bombs in this channel
							TriChomp TeaTime`;
						}
						return `${user['username']}, you have spelled it ${userValue[0].value}
						times TriChomp Clap - total of ${channelValue[0].valueCount} n bombs in this channel
						TriChomp TeaTime`;

					} else if (channel === "#nymn") {
						const channelValueCache = await custom.doQuery(`
							SELECT *
							FROM stats
							WHERE channel="nymn" AND type="stats"
							`);
						return `${user['username']}, total of ${channelValueCache[0].count} racists
						in this channel cmonBruh`;

					} else if (channel === "#forsen") {
						const channelValueCache = await custom.doQuery(`
							SELECT *
							FROM stats
							WHERE channel="forsen" AND type="stats"
							`);
						return `${user['username']}, total of ${channelValueCache[0].count} unpleasant people
						in this channel cmonBruh`;

					} else {
						// count the words in the channel
						const channelValue = await custom.doQuery(`
							SELECT COUNT(*) AS valueCount
							FROM logs_${channelParsed}
							WHERE message LIKE "%nigg%"
							`);
						if (channelValue[0].valueCount === 0) {
							return `${user['username']}, total of ${channelValue[0].valueCount} racists
							in this channel, we coo TriHard Clap`;
						}
						return `${user['username']}, total of ${channelValue[0].valueCount} racists
						in this channel cmonBruh`;
					}
				}

				// kb stats -bruh [user]
				if (msg[1].toLowerCase() === 'apollo' && channel === "#nymn") {
					const getCount = await custom.doQuery(`
						SELECT *
						FROM stats
						WHERE type="counter"
						`);
					await custom.doQuery(`
						UPDATE stats
						SET count="${Number(getCount[0].count)+Number((Math.random()*10).toFixed(0))}"
						WHERE sha="apollo"
						`);
					return `${user['username']}, Apollo has said it ${getCount[0].count} times TriSad`
				}

                const msgParsed = msg[1].replace('@', '').replace(',', '');
				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`
					SELECT * FROM user_list
					WHERE username="${msgParsed}"
					`);

				// check if channel exists in user_list logs
				if (checkIfUserExists.length === 0) {
					return `${user['username']}, that user does not exist in my user list logs.`;
				}

				if (msgParsed.toLowerCase() === 'teodorv' || msgParsed.toLowerCase() === 'phzeera') {
					return `${user['username']}, that user has opted out from this command.`;
				}

				const userValue = await custom.doQuery(`
					SELECT COUNT(*) AS value
					FROM logs_${channelParsed}
					WHERE username="${msgParsed}" AND message LIKE "%nigg%"
					`);

				// replace second character in user's name with an invisible character to prevent the ping
				const userNoPing = msgParsed.replace(/^(.{2})/, "$1\u{E0000}");

				if (channel === '#haxk') {
					if (userValue[0].value<2 && userValue[0].value != 1) {
						return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value}
						times, we coo TriHard`;
					}
					return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value}
					times TriChomp Clap`;
				}
				if (channel === '#forsen') {
					if (userValue[0].value === 0) {
						return `${user['username']} total of ${userValue[0].value} unpleasant activities
						by user ${userNoPing} we coo TriHard Clap`;
					}
					return `${user['username']} total of ${userValue[0].value} unpleasant activities
					by user ${userNoPing} in this channel cmonBruh`;
				}
				if (userValue[0].value === 0) {
					return `${user['username']} total of ${userValue[0].value} racist activities
					by user ${userNoPing} we coo TriHard Clap`;
				}
				return `${user['username']} total of ${userValue[0].value} racist activities
				by user ${userNoPing} in this channel cmonBruh`;
			}

			/* kb stats -lines */
			const statsLines = async() => {
				// check if user is provided
				const username = msg.filter(i => i.startsWith('@'))[0];
				// kb stats -lines @[user]
				if (username) {
    				// check if channel is provided
    				const channelName = msg.filter(i => i.startsWith('#'))[0];
    				// kb stats -lines #[channel] @[username]
    				if (channelName) {
    					// check if channel exists in logs
    					const checkChannel = await custom.doQuery(`
    						SHOW TABLES LIKE "logs_${channelName.replace('#', '')}"
    						`);
    					if (checkChannel.length === 0) {
    						return `${user['username']}, I'm not logging this channel,
    						therefore I can't display stats for it :/`;
    					}

    					// check if user exists in user_list logs
    					const checkIfUserExists = await custom.doQuery(`
    						SELECT * FROM user_list
    						WHERE username="${username.replace('@', '').replace(',', '')}"
    						`);
    					if (checkIfUserExists.length === 0) {
    						return `${user['username']}, that user does not exist in my user list logs.`;
    					}

    					const userLines = await custom.doQuery(`
    	                    SELECT COUNT(username) as value
    	                    FROM logs_${channelName.replace('#', '')}
    	                    WHERE username="${username.replace('@', '').replace(',', '')}"
    	                    `);
    	                const occurence = await  custom.doQuery(`
    	                    SELECT MAX(ID) as value
    	                    FROM logs_${channelName.replace('#', '')}
    	                    `);
    	                return `${user['username']}, this user has total of ${userLines[0].value} lines logged
                		in channel ${channelName.replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")},
                        that's ${((userLines[0].value/occurence[0].value)*100).toFixed(2)}%
                        of all lines in that channel.`
    				}
    					const checkIfUserExists = await custom.doQuery(`
    						SELECT * FROM user_list
    						WHERE username="${username.replace('@', '').replace(',', '')}"
    						`);

    					// check if channel exists in user_list logs
    					if (checkIfUserExists.length === 0) {
    						return `${user['username']}, that user does not exist in my user list logs.`;
    					}

    					const userLines = await custom.doQuery(`
    	                    SELECT COUNT(username) as value
    	                    FROM logs_${channelParsed}
    	                    WHERE username="${username.replace('@', '').replace(',', '')}"
    	                    `);
    	                const occurence = await  custom.doQuery(`
    	                    SELECT MAX(ID) as value
    	                    FROM logs_${channelParsed}
    	                    `);
    	                return `${user['username']}, this user has total of ${userLines[0].value} lines logged,
                        that's ${((userLines[0].value/occurence[0].value)*100).toFixed(2)}%
                        of all lines in this channel.`;
				}


                const values = await custom.doQuery(`
                    SELECT COUNT(username) as value
                    FROM logs_${channelParsed}
                    WHERE username="${user['username']}"
                    `);
                const occurence = await  custom.doQuery(`
                    SELECT MAX(ID) as value
                    FROM logs_${channelParsed}
                    `);
                return `${user['username']}, you have total of ${values[0].value} lines logged,
                that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                of all lines in this channel.`
			}

            const statsColor = async() => {
                const got = require(`got`);
                if (!msg[1]) {
                    if (user['color'] === null) {
                        const usersData = await custom.doQuery(`
                            SELECT COUNT(*) AS users
                            FROM user_list
                            WHERE color="gray"
                            `);

                        return `${user['username']}, you don't have any color set (gray on chatterino),
                        ${userData[0].users-1} users didn't set their colors either :o`;
                    }

                    const usersData = await custom.doQuery(`
                        SELECT COUNT(*) AS users
                        FROM user_list
                        WHERE color="${user['color']}"
                        `);

                    const color = await got(`https://www.thecolorapi.com/id?hex=${user['color'].replace('#', '')}`).json();
                    return `${user['username']}, you share your color (${color.name.value} ${user['color']}) with ${usersData[0].users-1}
                    other users logged in my database B)`;
                }

                const checkIfUserExists = await custom.doQuery(`
                    SELECT *
                    FROM user_list
                    WHERE username="${msg[1].replace('@', '')}"
                    `);

                if (checkIfUserExists.length === 0) {
                    return `${user['username']}, this user does not exist in my database.`;
                }

                if (checkIfUserExists[0].color === "gray" || checkIfUserExists[0].color === null) {
                    const userData = await custom.doQuery(`
                        SELECT COUNT(*) AS users
                        FROM user_list
                        WHERE color="gray"
                        `);
                    return `${user['username']}, this user has not set a color yet (gray on chatterino),
                    ${userData[0].users-1} other users didn't set their colors either :o`;
                }

                const usersData = await custom.doQuery(`
                    SELECT COUNT(*) AS users
                    FROM user_list
                    WHERE color="${checkIfUserExists[0].color}"
                    `);

                const color = await got(`https://www.thecolorapi.com/id?hex=${checkIfUserExists[0].color.replace('#', '')}`).json();

                if (usersData[0].users === 1) {
                    return `${user['username']}, that user is the only one with color
                   ${color.name.value} ${checkIfUserExists[0].color}! PogChamp`;
                }

                return `${user['username']}, this user's color (${color.name.value} ${checkIfUserExists[0].color})
                is being used by ${usersData[0].users-1} other users`;
            }


            const checkStatsPrefix = (input) => {
                return msg.filter(i => i.toLowerCase().includes(input))
                    .toString()
                    .includes(input);
            }

			const checkStatsUserPrefix = msg.filter(i => i.startsWith('@')).toString().includes('@');


			switch (true) {
				case checkStatsPrefix('-bruh'):
					return statsBruh(); // kb stats -bruh [@user]

				case checkStatsPrefix('-lines'):
					return statsLines(); // kb stats -lines [@user] [#channel]

				case checkStatsPrefix('-channel'):
					return statsChannel(); // kb stats -channel [#channel]

                case checkStatsPrefix('-color'):
                    return statsColor(); // kb stats -color [@user]

				case checkStatsUserPrefix:
					return statsUser(); // kb stats [@user] [message]

                case msg.length != 0:
					return statsMessage(); // kb stats [message]

				default:
					return stats() // kb stats
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}