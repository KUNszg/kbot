#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb help",
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);

            const command = await custom.doQuery(`
                SELECT *
                FROM commands
                WHERE command="${msg[0]}"
                `);

            // if there is no parameter given, return basic command message
            if (!msg[0]) {
                return `${user['username']}, kunszgbot is owned by KUNszg, sponsored by
                ${'Leppunen'.replace(/^(.{2})/, "$1\u{E0000}")}, Node JS ${process.version}, running on
                Ubuntu 20.04 GNU/${process.platform} ${process.arch}, for commands list use 'kb commands'.`;
            }

            if (msg[0] === "help") {
                return `${user['username']}, syntax: kb help [command] | no parameter - shows basic
                information about bot, it's owner and host | command - shows description
                of a specified command -- cooldown 5s`;
            }

            if (!command.length) {
                return `${user['username']}, this command does not exist.`;
            }

            if (command[0].description === null) {
                return `${user['username']}, this command does not have a description.`;
            }

            // check if user is permitted to reduced cooldown
            const permissions = (await custom.checkPermissions(user['username']) > 0) ? (command[0].cooldown/2000).toFixed(2) : command[0].cooldown/1000;

            if (channel === "#forsen") {
                if (command[0].description_formatted != null) {
                    return `${user['username']}, ${command[0].description_formatted} -- cooldown ${permissions}sec`;
                }
                return `${user['username']}, ${command[0].description} -- cooldown ${permissions}sec`;
            }
            return `${user['username']}, ${command[0].description} -- cooldown ${permissions}sec`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}