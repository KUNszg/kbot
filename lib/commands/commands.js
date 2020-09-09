#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "commands",
	aliases: null,
	description: `list of commands`,
	permission: 0,
	invocation: async (channel, user, args) => {
		try {
			const perm = await custom.checkPermissions(user['username'])

			const requireDir = require('require-dir');
			const commands = requireDir('./');

			const convertToArray = Object.keys(commands).map(key => {
			  return commands[key];
			})

			const getCommands = convertToArray.filter(
				i => i.name.replace('kb ', '') && i.permission <= perm
				);

			const getCommandNames = getCommands.map(
				i => i.name.replace('kb ', '')
				);

			const sortCommandsByName = (getCommandNames.sort().join(' / '));

			if (perm == 0 || perm == -1) {
				return `${user['username']}, ${getCommandNames.length} active commands
				PogChamp 👉 (prefix: kb) / ${sortCommandsByName} /`;
			}

			const getPermNames =  await custom.doQuery(`
				SELECT *
				FROM trusted_users
				WHERE username="${user['username']}"
				`)

			return `${user['username']}, ${getCommandNames.length} active commands with
			your permissions PogChamp 👉 (${getPermNames[0].permissions}) / ${sortCommandsByName} /`;

		} catch (err) {
			custom.errorLog(err.message)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}