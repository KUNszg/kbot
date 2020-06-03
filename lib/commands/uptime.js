#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const prefix = "kb ";

module.exports = {
	name: prefix + "uptime",
	aliases: null,
	description: `displays informations about current runtime of the bot, lines,
	memory usage, host uptime and commands used in the current session -- cooldown 8s`,
	permission: 0,
	cooldown: 8000,
	invocation: async (channel, user, message, args) => {
		try {

			const getOtherModules = await custom.doQuery(`
				SELECT * FROM memory
				`)
			const used = (
				Number(getOtherModules[0].memory) +
				Number(getOtherModules[1].memory) +
				Number(getOtherModules[2].memory) +
				Number((process.memoryUsage().heapUsed/1024/1024).toFixed(2))
				).toFixed(2);

			const os = require('os');
			const uptime = process.uptime();
			const serverUptimeHours = os.uptime()/3600;
			const serverUptimeDays = os.uptime()/86400;

			const requireDir = require('require-dir');
			const commands = requireDir('../commands');

			// get line count of all relevant bot files
			async function getLineCount(file) {
                const exec = require('child_process').exec;
                const linecount =  exec(`wc ${file}`, function (error, results) {
                    return results
                });
			}

			const keys = Object.keys(commands).map(i=>'./lib/commands/' + i + '.js');
			const getData = async () => {
			  	return Promise.all(keys.map(item => getLineCount(item)))
			}
            console.log(getData)
			// get line count and create an array
			const linesArray = await Promise.all([
				(await getData()).reduce((a,b) => a + b, 0),
				getLineCount('./lib/handler.js'),
				getLineCount('./lib/utils/functions.js'),
				getLineCount('./lib/static/interval_calls.js'),
				getLineCount('./lib/static/static_commands.js'),
				getLineCount('./lib/credentials/login.js'),
				getLineCount('./api.js'),
				getLineCount('./init.js'),
				getLineCount('./logger.js'),
				getLineCount('./reminders.js')
			])
			const lines = linesArray.reduce((a,b) => a + b, 0)

			commands.length = 0;
			// if server is live for more than 72 hours and code uptime is less than 42h
			if (serverUptimeHours > 72 && uptime < 172800) {
				return `${user['username']}, code is running for ${custom.formatUptime(uptime)}, has ${lines} lines total,
				memory usage: ${used} MB, host is up for ${serverUptimeDays.toFixed(2)} days FeelsDankMan`;
			}

			// if code uptime is more than 42h and server is live for more than 72h
			if (uptime > 172800 && serverUptimeHours > 72) {
				return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, has ${lines} lines total,
				memory usage: ${used} MB, host is up for
				${serverUptimeHours.toFixed(1)}h (${serverUptimeDays.toFixed(2)} days) FeelsDankMan`;
			}

			// if code uptime is more than 42h and server is live for less than 72h
			if (uptime > 172800 && serverUptimeHours < 72) {
				return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, has ${lines} lines total,
				memory usage: ${used} MB, host is up for ${serverUptimeHours.toFixed(1)}h FeelsDankMan`;
			}

			// default response
			return `${user['username']}, code is running for ${custom.formatUptime(uptime)}, has ${lines} lines total,
			memory usage: ${used} MB, host is up for ${serverUptimeHours.toFixed(1)}h
			(${serverUptimeDays.toFixed(2)} days) FeelsDankMan`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
