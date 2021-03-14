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
            this.memoryUsage = await custom.query(`SELECT * FROM memory`);

            this.memoryUsage = (
                Number(this.memoryUsage[0].memory) +
                Number(this.memoryUsage[1].memory) +
                Number(this.memoryUsage[2].memory) +
                Number((process.memoryUsage().heapUsed/1024/1024).toFixed(2))
                ).toFixed(2);

            const uptime = process.uptime();
            const serverUptime = os.uptime();
            const lines = shell.execSync(`find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`);

            return `${user['username']}, code is running for ${custom.humanizeDuration(uptime)} and has ${lines} lines,
            memory usage: ${this.memoryUsage} MB, host is up for ${custom.humanizeDuration(serverUptime)} FeelsDankMan`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}