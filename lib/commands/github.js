#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb github',
  invocation: async (channel, user) => {
    try {
      const commitDate = await utils.query(`
                SELECT *
                FROM stats
                WHERE type="ping"
                `);

      const diff = Math.abs(commitDate[0].date - new Date());

      return `${user['username']}, my public repo Okayga 👉 https://github.com/KUNszg/kbot
            last commit: ${utils.humanizeDuration(diff / 1000)} ago`;
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
