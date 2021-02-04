#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb rl",
	invocation: async (channel, user, message, platform) => {
		try {
            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

			const checkChannel = await custom.doQuery(`
                SHOW TABLES LIKE "logs_${channel.replace('#', '')}"
                `);

			if (!checkChannel.length) {
				return `${user['username']}, I'm not logging this channel,
				therefore I can't display data for this command :/`;
			}

			const msg = (message.split(' ')[1] === "rq") ?
                custom.getParam(message, 1) : custom.getParam(message);

            if (msg.includes("teodorv")) {
                return "FeelsBadMan <3";
            }

            // checks if output message is not too long
            class ModifyOutput {
                constructor(input) {
                    this.input = input;
                }

                trimmer() {
                    if (channel === "#forsen" || channel === "#vadikus007") {
                        if (this.input.includes('⣿')) {
                            return ' [braille copypasta]';
                        }
                        return (this.input.length > 93) ? `${this.input.substr(0, 93)}(...)` : this.input;
                    }
                    return this.input.substr(0, 430);
                }
            }

            // kb rq
            if (msg[0] === "rq") {
                // check if user points to other channel
                let userSpecifiedChannel = msg.find(i => i.startsWith('#'));
                userSpecifiedChannel = (!global?.userSpecifiedChannel ?? true) ? userSpecifiedChannel : userSpecifiedChannel.toLowerCase();

                if (userSpecifiedChannel) {
                    if ((userSpecifiedChannel === '#supinic' || userSpecifiedChannel === "#haxk") && userSpecifiedChannel != channel) {
                        return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
                    }

                    // check if user exists in the database
                    const checkInputChannel = await custom.doQuery(`
                        SHOW TABLES LIKE "logs_${userSpecifiedChannel.replace('#', '')}"
                        `);
                    if (!checkInputChannel.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }

                    // query to get a random range of rows
                    const getRows = await custom.doQuery(`
                        SELECT @min := MIN(id) as min,
                               @max := MAX(id) as max
                        FROM logs_${userSpecifiedChannel.replace('#', '')};
                        `);
                    const randomResults = await custom.doQuery(`
                        SELECT a.*
                            FROM logs_${userSpecifiedChannel.replace('#', '')} a
                            JOIN ( SELECT id FROM
                                    ( SELECT id
                                        FROM ( SELECT ${getRows[0].min} + (${getRows[0].max} - ${getRows[0].min} + 1 - 50) * RAND() AS start FROM DUAL ) AS init
                                        JOIN logs_${userSpecifiedChannel.replace('#', '')} y
                                        WHERE    y.id > init.start AND username="${user['username']}"
                                        ORDER BY y.id
                                        LIMIT 50
                                    ) z ORDER BY RAND()
                                   LIMIT 1
                                 ) r ON a.id = r.id;
                        `);

                    // find a random element of returned array
                    const randomLine = Array(custom.random(randomResults));

                    if (!randomLine.length) {
                        return `${user['username']}, I don't have any logs from this channel related to you :z`;
                    }

                    const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                    const result = new ModifyOutput(randomLine[0].message);

                    return `${userSpecifiedChannel.replace(/^(.{2})/, "$1\u{E0000}")} (${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}: ${result.trimmer()}`;
                }

                const checkChannel = await custom.doQuery(`
                    SHOW TABLES LIKE "logs_${channel.replace('#', '')}"
                    `);
                if (!checkChannel.length) {
                    return `${user['username']}, I'm not logging this channel, therefore I can't display
                    data for this command :/`;
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
                            WHERE    y.id > init.start AND username="${user['username']}"
                            ORDER BY y.id
                            LIMIT 50
                        ) z ORDER BY RAND()
                        LIMIT 50
                    ) r ON a.id = r.id;
                    `);

                const randomLine = Array(custom.random(randomResults));

                if (!randomLine.length) {
                    return `${user['username']}, I don't have any logs from this channel related to you :z`;
                }

                const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                const result = new ModifyOutput(randomLine[0].message);

                return `(${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}:  ${result.trimmer()}`;
            }

            // kb rl
			if (!msg[0]) {
				const maxID = await custom.doQuery(`
                    SELECT MAX(ID) AS number
                    FROM logs_${channel.replace('#', '')}
                    `);

				// get random ID from the range of ID's in database
				const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

				const randomLine = await custom.doQuery(`
					SELECT ID, username, message, date
					FROM logs_${channel.replace('#', '')}
					WHERE ID="${randNum}"
					`);
				if (!randomLine.length) {
					return `${user['username']}, I don't have any logs from this channel :z`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                const result = new ModifyOutput(randomLine[0].message);

                return `(${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}:  ${result.trimmer()}`;
			}

			if ((msg?.[0] ?? false) && msg[0] != "") {
				// check if user points to other channel
				let userSpecifiedChannel = msg.find(i => i.startsWith('#'));
                let userSpecifiedUsername = msg.find(i => i.startsWith('@'));

                // kb rl [#channel]
				if (typeof userSpecifiedChannel != "undefined" && typeof userSpecifiedUsername === "undefined") {
					if (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === "#haxk") {
						return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
					}

					// check if user exists in the database
					const checkIfLogging = await custom.doQuery(`
						SHOW TABLES LIKE "logs_${userSpecifiedChannel.replace('#', '')}"
						`);

					if (!checkIfLogging.length) {
						return `${user['username']}, I'm not logging the channel you specified :/`;
					}

					const maxID = await custom.doQuery(
						`SELECT MAX(ID) AS number FROM logs_${userSpecifiedChannel.replace('#', '')}`
						);

					const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;

					const randomLine = await custom.doQuery(`
						SELECT ID, username, message, date
						FROM logs_${userSpecifiedChannel.replace('#', '')} WHERE ID="${randNum}"
						`);

					if (!randomLine.length) {
						return `${user['username']}, I don't have any logs from this channel :z`;
					}

					const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                    const result = new ModifyOutput(randomLine[0].message);

                    return `${userSpecifiedChannel.replace(/^(.{2})/, "$1\u{E0000}")} (${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}: ${result.trimmer()}`;
				}

                // kb rl [@user] [#channel]
                if (typeof userSpecifiedChannel != "undefined" && typeof userSpecifiedUsername != "undefined") {
                    if (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === "#haxk") {
                        return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
                    }

                    // check if user exists in the database
                    const checkIfLogging = await custom.doQuery(`
                        SHOW TABLES LIKE "logs_${userSpecifiedChannel.replace('#', '')}"
                        `);

                    if (!checkIfLogging.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }

                    const checkUser = await custom.doQuery(`
                        SELECT *
                        FROM user_list
                        WHERE username="${userSpecifiedUsername.replace('@', '')}"
                        `);

                    if (!checkUser.length) {
                        return `${user['username']}, user ${userSpecifiedUsername.replace('@', '')} was not found in the database.`;
                    }

                    const getRows = await custom.doQuery(`
                        SELECT @min := MIN(id) as min, @max := MAX(id) as max
                        FROM logs_${userSpecifiedChannel.replace('#', '')};
                        `);
                    const randomResults = await custom.doQuery(`
                        SELECT a.*
                        FROM logs_${userSpecifiedChannel.replace('#', '')} a
                        JOIN ( SELECT id FROM
                            ( SELECT id
                                FROM ( SELECT ${getRows[0].min} + (${getRows[0].max} - ${getRows[0].min} + 1 - 50) * RAND()
                                AS start FROM DUAL ) AS init
                                JOIN logs_${userSpecifiedChannel.replace('#', '')} y
                                WHERE    y.id > init.start AND username="${userSpecifiedUsername.replace('@', '')}"
                                ORDER BY y.id
                                LIMIT 50
                            ) z ORDER BY RAND()
                            LIMIT 50
                        ) r ON a.id = r.id;
                        `);

                    const randomLine = Array(custom.random(randomResults));

                    if (!randomLine.length) {
                        return `${user['username']}, there are no logs in my database from this channel related to that user.`;
                    }

                    const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                    const result = new ModifyOutput(randomLine[0].message);

                    return `${userSpecifiedChannel.replace(/^(.{2})/, "$1\u{E0000}")} (${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}: ${result.trimmer()}`;
                }

                // kb rl [@user]
                // check if user exists in the database
                const checkIfUserExists = await custom.doQuery(`
                    SELECT *
                    FROM user_list
                    WHERE username="${msg[0].replace('@', '').replace(',', '')}"
                    `);
                if (!checkIfUserExists.length) {
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
                            WHERE    y.id > init.start AND username="${msg[0].replace('@', '').replace(',', '')}"
                            ORDER BY y.id
                            LIMIT 50
                        ) z ORDER BY RAND()
                        LIMIT 50
                    ) r ON a.id = r.id;
                    `);

                if (!randomResults.length) {
                    return `${user['username']}, there are no logs in my database from this channel related to that user.`;
                }
                const randomLine = Array(custom.random(randomResults));

                const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                const result = new ModifyOutput(randomLine[0].message);

                return `(${custom.humanizeDuration(timeDifference)} ago) ${randomLine[0].username}:  ${result.trimmer()}`;
			}
		} catch (err) {
			custom.errorLog(err)
			return ``;
		}
	}
}