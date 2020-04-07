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

			// get line count of all relevant bot files 
			const linecount = require('linecount');
			async function getLineCount(file) {
				const lines = await new Promise((resolve, reject) => { 	
					linecount(file, (err, count) => {
						if (err) {
							reject(err);
						} else {
							resolve(count);
						}
					});
				});
				return lines;
			} 
			/* todo: display lines for all files
			const lines = await getLineCount('./lib/handler.js') + await getLineCount('./reminders.js') + 
			await getLineCount('./logger.js') + await getLineCount('./api.js');
			*/

			// if server is live for more than 72 hours and code uptime is less than 42h 
			if (serverUptimeHours > 72 && uptime < 172800) {
				return `${user['username']}, code is running for ${custom.formatUptime(uptime)}, 
				memory usage: ${used} MB, host is up for ${serverUptimeDays.toFixed(2)} days FeelsDankMan`;
			}
			
			// if code uptime is more than 42h and server is live for more than 72h
			if (uptime > 172800 && serverUptimeHours > 72) {
				return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, 
				memory usage: ${used} MB, host is up for 
				${serverUptimeHours.toFixed(1)}h (${serverUptimeDays.toFixed(2)} days) FeelsDankMan`;
			} 
			
			// if code uptime is more than 42h and server is live for less than 72h
			if (uptime > 172800 && serverUptimeHours < 72) {
				return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, 
				memory usage: ${used} MB, host is up for 
				${serverUptimeHours.toFixed(1)}h FeelsDankMan`;
			} 
			
			// default response
			return `${user['username']}, code is running for ${custom.formatUptime(uptime)},
			memory usage: ${used} MB, host is up for ${serverUptimeHours.toFixed(1)}h 
			(${serverUptimeDays.toFixed(2)} days) FeelsDankMan`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
