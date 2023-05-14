#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const os = require('os');
const shell = require('child_process');

module.exports = {
  name: 'kb uptime',
  invocation: async (channel, user, message) => {
    try {
      this.memoryUsage = await utils.query(`SELECT * FROM memory`);

      this.memoryUsage = (
        Number(this.memoryUsage[0].memory) +
        Number(this.memoryUsage[1].memory) +
        Number(this.memoryUsage[2].memory) +
        Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))
      ).toFixed(2);

      const serverUptime = os.uptime();
      const lines = shell.execSync(
        `find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`
      );

      const commitData = await utils.query(`
                SELECT *
                FROM stats
                WHERE type="ping"`);

      const diff = Math.abs(commitData[0].date - new Date());

      return (
        user['username'] +
        ', code has' +
        lines +
        ' lines, latest commit: ' +
        utils.humanizeDuration(diff / 1000) +
        ' ago, memory usage: ' +
        this.memoryUsage +
        ' MB, server is up for ' +
        utils.humanizeDuration(serverUptime) +
        ' FeelsDankMan'
      );
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
