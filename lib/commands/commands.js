#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb commands",
	invocation: async (channel, user, args) => {
		try {
			let perm = await custom.checkPermissions(user['username']);
            perm = Number(perm);

            const getCommands = custom.doQuery(`
                SELECT *
                FROM commands
                WHERE permissions<="${perm}"
                `);

			const getCommandNames = getCommands.map(
				i => i.command
				);

			const sortCommandsByName = (getCommandNames.sort().join(' / '));

			if (perm === 0 || perm === -1) {
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