#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: 'kb optout',
	invocation: async (channel, user, message) => {
		try {
            if (user["username"] != "kunszg") {
                return`${user['username']}, this command is work-in-progress.`;
            }

            // handle aliases
            const convertToRegexp = (input) => {
                return new RegExp(`\\b${input}\\b`, "i")
            }

            const param = message.toLowerCase().split(' ')[2]

            let alias = require('../../data/aliases.json').data.filter(i => i[param]);

            let [getRegex, getReplacement] = ['', ''];

            if (alias.length) {
                getRegex = convertToRegexp(Object.keys(alias[0]));
                getReplacement = Object.values(alias[0])[0];
            }

            const msg = await custom.getParam(message.replace(getRegex, getReplacement));

            if (!msg[0]) {
                return `${user['username']}, you must provide a command you wish to
                optout from, check command's help if needed.`;
            }

            if (msg[0] === "all") {
                const optout = await custom.query(`
                    SELECT *
                    FROM optout
                    WHERE userid=?`,
                    [user['user-id']]);

                const commands = await custom.doQuery(`
                    SELECT *
                    FROM commands
                    WHERE optoutable="Y"
                    `);

                if (!optout.length) {
                    for (let i = 0; i < commands.length; i++) {
                        await custom.query(`
                            INSERT INTO optout (username, userId, command, commandId, date)
                            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [user['username'], user['user-id'], commands[i].command, commands[i].id]);

                    }
                    return `${user['username']}, you have successfully opted out of all optoutable commands.`;
                }

                await custom.query(`
                    DELETE FROM optout
                    WHERE userId=?
                    `, [user['user-id']]);

                return `${user['username']}, you have unoptedout from all the commands.`;
            }

            const command = await custom.query(`
                SELECT *
                FROM commands
                WHERE command=?`,
                [msg[0].toLowerCase()]);

            if (!command.length) {
                return `${user['username']}, that command does not exist.`;
            }

            if (command[0].optoutable === "N") {
                return `${user['username']}, specified command is not optoutable.`;
            }

            const optout = await custom.query(`
                SELECT *
                FROM optout
                WHERE userid=? AND commandId=?`,
                [user['user-id'], command[0].ID]);

            if (!optout.length) {
                await custom.query(`
                    INSERT INTO optout (username, userId, command, commandId, date)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [user['username'], user['user-id'], msg[0].toLowerCase(), command[0].ID]);

                return `${user['username']}, you have successfully
                opted out of command ${command[0].command}.`;
            }

            await custom.query(`
                DELETE FROM optout
                WHERE commandId=? AND userid=?`,
                [command[0].ID, user['user-id']]);

            return `${user['username']}, you have successfully
            unoptedout from command ${command[0].command}.`;
		} catch (err) {
			await custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}