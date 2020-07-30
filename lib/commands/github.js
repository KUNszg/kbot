#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
    name: prefix + 'github',
    aliases: null,
    description: `link to my github repo and last commit timer`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {
            const commitDate = await custom.doQuery(`
                SELECT *
                FROM stats
                WHERE type="ping"
                `);

            const diff = Math.abs(commitDate[0].date - new Date())

            return `${user['username']}, my public repo Okayga 👉 https://github.com/KUNszg/kbot
            last commit: ${custom.secondsToDhms(diff/1000)} ago`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}