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

            const ping = (msg) => {
                const aliases = [
                    {"1": "ping", "2": "pong"},
                    {"1": "pong", "2": "ping"},
                    {"1": "peng", "2": "pang"},
                    {"1": "pang", "2": "peng"},
                    {"1": "pung", "2": "pyng"},
                    {"1": "pyng", "2": "pung"},
                ]

                const msg = custom.getParam(msg, 1);
                return aliases.filter(i => i["1"] === msg[0])
            }

			return `${user['username']}, ${ping(message)["2"]} FeelsDankMan 🏓 ppHop 🏓💻 latest commit: ${custom.secondsToDhms(diff/1000)} ago
			(main, ${commitData[0].sha}, commit ${commitCount})`;
		} catch (err) {
			custom.errorLog(err)
			return 	`${user['username']}, error FeelsDankMan !!!`;
		}
	}
}