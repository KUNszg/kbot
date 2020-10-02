#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb rq",
	invocation: async (channel, user, message) => {
		try {
			const msg = custom.getParam(message);

			// check if user points to other channel
			const userSpecifiedChannel = msg.find(i => i.startsWith('#'));

            class ModifyOutput {
                constructor(input) {
                    this.input = input;
                }

                trimmer() {
                    if (channel === "#forsen" || channel === "#vadikus007") {
                        return (this.input.length > 93) ? `${this.input}(...)` : this.input.substr(0, 93);
                    }
                    return this.input.substr(0, 430);
                }
            }

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
                            WHERE    y.id > init.start AND username="${user['username']}"
                            ORDER BY y.id
                            LIMIT 50
                        ) z ORDER BY RAND()
                        LIMIT 50
                    ) r ON a.id = r.id;
                    `);

                // find a random element of returned array
                const randomLine = Array(custom.random(randomResults));

				if (!randomLine.length) {
					return `${user['username']}, I don't have any logs from this channel related to you :z`;
				}

				const timeDifference = (Math.abs(Date.now() - (Date.parse(randomLine[0].date)))/1000);

                const result = new ModifyOutput(randomLine[0].message);

				return `${userSpecifiedChannel.replace(/^(.{2})/, "$1\u{E0000}")} (${custom.secondsToDhm(timeDifference)} ago) ${result.trimmer()}`;
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

            return `${randomLine[0].username} (${custom.secondsToDhm(timeDifference)} ago) ${result.trimmer()}`;

		} catch (err) {
			custom.errorLog(err)
			return ``;
		}
	}
}
