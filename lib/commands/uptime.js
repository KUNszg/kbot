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
			const readline = require('readline');
            const fs = require('fs');

            var file = '../handler.js';
            var linesCount = 0;
            var rl = readline.createInterface({
                input: fs.createReadStream(file),
                output: process.stdout,
                terminal: false
            });
            rl.on('line', function (line) {
                linesCount++; // on each linebreak, add +1 to 'linesCount'
            });
            rl.on('close', function () {
                console.log(linesCount); // print the result when the 'close' event is called
            });


		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
