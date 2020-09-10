#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
    name: prefix + "help",
    aliases: null,
    description: `syntax: kb help [command] | no parameter - shows basic information about bot,
    it's owner and host | command - shows description of a specified command`,
    permission: 0,
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message);

            const requireDir = require('require-dir');
            const commandList = requireDir('./');
            const command = commandList[msg[0]];
            const cd = custom.doQuery(`
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

            if (typeof command === "undefined") {
                return `${user['username']}, this command does not exist.`;
            }
            if (!command.description) {
                return `${user['username']}, this command does not have a description.`;
            }

            console.log(cd)
            // check if user is permitted to reduced cooldown, if not then convert the value to seconds
            const permissions = (await custom.checkPermissions(user['username']) > 0) ? (cd[0].cooldown/2000).toFixed(2) : cd[0].cooldown/1000;

            if (channel != "#forsen") {
                return `${user['username']}, ${command.description} -- cooldown ${permissions}sec`;
            }

            if (command?.description_formatted ?? false) {
                return `${user['username']}, ${command.description_formatted} -- cooldown ${permissions}sec`;
            }
            return `${user['username']}, ${command.description} -- cooldown ${permissions}sec`;

            // if something else that is not handled happens, throw an error
            throw 'internal error monkaS';

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}