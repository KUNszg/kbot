#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const shell = require('child_process');

module.exports = {
	name: "kb ping",
	invocation: async (channel, user, message) => {
		try {
            const commitData = await utils.query(`
                SELECT *
                FROM stats
                WHERE type="ping"`);

			const diff = Math.abs(commitData[0].date - new Date())

            const ping = (input) => {
                const aliases = [
                    {"1": "ping", "2": "pong"},
                    {"1": "pong", "2": "ping"},
                    {"1": "peng", "2": "pang"},
                    {"1": "pang", "2": "peng"},
                    {"1": "pung", "2": "pyng"},
                    {"1": "pyng", "2": "pung"},
                ]

                const msg = utils.getParam(input, 1);
                const findWord = aliases.filter(i => i["1"] === msg[0]);

                return findWord[0]["2"]
            }

            const commitCount = process.platform === "linux" ? Number(shell.execSync("git rev-list --all --count")) : "no data";

			return `${user['username']}, ${ping(message)} FeelsDankMan 🏓 ppHop 🏓💻 you can check live bot status at https://kunszg.com/` +
            `latest commit: ${utils.humanizeDuration(diff/1000)} ago (master, ${commitData[0].sha}, commit ${commitCount})`;
		} catch (err) {
			utils.errorLog(err)
			return 	`${user['username']}, error FeelsDankMan !!!`;
		}
	}
}