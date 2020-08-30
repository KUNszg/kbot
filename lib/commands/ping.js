#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const shell = require('child_process');

module.exports = {
	name: prefix + "ping",
	aliases: null,
	description: `command to check if bot is alive and data about latest github commit`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args, err) => {
		try {
            const commitCount = shell.execSync("git rev-list --all --count");
            const commitData = await custom.doQuery(`
                SELECT *
                FROM stats
                WHERE type="ping"
                `);

			const diff = Math.abs(commitData[0].date - new Date())

			return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 latest commit: ${custom.secondsToDhms(diff/1000)} ago
			(main, ${commitData[0].sha}, commit ${Number(commitCount)})`;
		} catch (err) {
			custom.errorLog(err)
			return 	`${user['username']}, error FeelsDankMan !!!`;
		}
	}
}