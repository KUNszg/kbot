#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch')

module.exports = {
    name: prefix + 'github',
    aliases: null,
    description: `link to my github repo and last commit timer -- cooldown 5s`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {

            const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
                .then(response => response.json());

            const commitDate = await custom.doQuery(`
                SELECT *
                FROM stats
                WHERE type="ping"
                `);

            const serverDate = new Date();
            const diff = Math.abs(commitDate[0].date - serverDate)
            const DifftoSeconds = (diff / 1000).toFixed(2);

            return `${user['username']}, my public repo Okayga 👉 https://github.com/KUNszg/kbot
            last commit: ${custom.formatGithub(DifftoSeconds)} ago`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}