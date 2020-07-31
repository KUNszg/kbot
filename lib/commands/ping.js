#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "ping",
	aliases: null,
	description: `command to check if bot is alive and data about latest github commit`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args, err) => {
		try {
			const commitData = await custom.doQuery(`
				SELECT * 
				FROM stats 
				WHERE type="ping"
				`);

			const diff = Math.abs(commitData[0].date - new Date())

			return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 check out my website
			(under development) https://kunszg.xyz/ latest commit: ${custom.secondsToDhms(diff/1000)} ago
			(main, ${commitData[0].sha}, commit ${commitData[0].count})`;
		} catch (err) {
			custom.errorLog(err)
			if (err.message.includes("undefined")) {
				return `${user['username']}, N OMEGALUL`;
			}
			return 	`${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}