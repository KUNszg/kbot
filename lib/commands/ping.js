#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "ping",
	aliases: null,
	description: `usage: no parameter - data about latest github activity |
	service - checks if server/domain is alive -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args, err) => {
		try {

			const commitData = await custom.doQuery('SELECT * FROM stats WHERE type="ping"');
			const serverDate = new Date();
			const diff = Math.abs(commitData[0].date - serverDate)
			const latestCommit = (diff / 1000).toFixed(2);

			if (latestCommit > 259200) {
				return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 my website
				(under development) https://kunszg.xyz/ latest commit: ${(latestCommit / 86400).toFixed(0)} days
				ago (master, ${commitData[0].sha}, commit ${commitData[0].count})`;
			}
			return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 check out my website
			(under development) https://kunszg.xyz/ latest commit: ${custom.formatPing(latestCommit)} ago
			(master, ${commitData[0].sha}, commit ${commitData[0].count})`;

		} catch (err) {
			custom.errorLog(err)
			if (err.message.includes("undefined")) {
				return `${user['username']}, N OMEGALUL`;
			}
			return 	`${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}