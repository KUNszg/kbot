#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const os = require('os');
const fs = require('fs');
const shell = require('child_process');

module.exports = {
    name: "kb uptime",
    invocation: async (channel, user, message) => {
        try {
            const loggedMemoryUsage = await custom.doQuery(`
                SELECT *
                FROM memory
                `);

            const memoryUsage = (
                Number(loggedMemoryUsage[0].memory) +
                Number(loggedMemoryUsage[1].memory) +
                Number(loggedMemoryUsage[2].memory) +
                Number((process.memoryUsage().heapUsed/1024/1024).toFixed(2))
                ).toFixed(2);

            const codeUptime = process.uptime();
            const serverUptime = os.uptime();
            const lines = shell.execSync(`find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`);

            return `${user['username']}, code is running for ${custom.secondsToDhms(codeUptime)} and has ${lines} lines,
            memory usage: ${memoryUsage} MB, host is up for ${custom.secondsToDhms(serverUptime)} FeelsDankMan`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}