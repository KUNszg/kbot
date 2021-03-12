#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb github",
    invocation: async (channel, user) => {
        try {
            const commitDate = await custom.query(`
                SELECT *
                FROM stats
                WHERE type="ping"
                `);

            const diff = Math.abs(commitDate[0].date - new Date())

            return `${user['username']}, my public repo Okayga 👉 https://github.com/KUNszg/kbot
            last commit: ${custom.humanizeDuration(diff/1000)} ago`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}