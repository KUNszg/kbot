#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const os = require('os');
const fs = require('fs');

module.exports = {
    name: "kb uptime",
    invocation: async (channel, user, message, args) => {
        try {
            const getOtherModules = await custom.doQuery(`
                SELECT * FROM memory
                `);

            const used = (
                Number(getOtherModules[0].memory) +
                Number(getOtherModules[1].memory) +
                Number(getOtherModules[2].memory) +
                Number((process.memoryUsage().heapUsed/1024/1024).toFixed(2))
                ).toFixed(2);

            const codeUptime = process.uptime();
            const serverUptime = os.uptime()

            // get line count of all relevant bot files
            const linecount = require('linecount');
            const getLineCount = async (file) => {
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

            const commands = fs.readdirSync('./lib/commands');
            const keys = commands.map(i => './lib/commands/' + i)

            const getData = async () => {
                return Promise.all(keys.map(item => getLineCount(item)))
            }

            // get line count and create an array
            const linesArray = await Promise.all([
                (await getData()).reduce((a, b) => a + b, 0),
                getLineCount('./lib/handler.js'),
                getLineCount('./lib/utils/functions.js'),
                getLineCount('./lib/static/interval_calls.js'),
                getLineCount('./lib/static/static_commands.js'),
                getLineCount('./lib/static/chatters.js'),
                getLineCount('./lib/static/channel_status.js'),
                getLineCount('./lib/credentials/login.js'),
                getLineCount('./api.js'),
                getLineCount('./init.js'),
                getLineCount('./logger.js'),
                getLineCount('./reminders.js')
            ])
            const lines = linesArray.reduce((a,b) => a + b, 0)

            commands.length = 0;

            return `${user['username']}, code is running for ${custom.secondsToDhms(codeUptime)} and has ${lines} lines total,
            memory usage: ${used} MB, host is up for ${custom.secondsToDhms(serverUptime)} FeelsDankMan`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}