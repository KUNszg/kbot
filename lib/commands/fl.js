#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb fl",
    invocation: async (channel, user, message, platform) => {
        try {
            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

            const msg = custom.getParam(message)

            const checkChannel = await custom.query("SHOW TABLES LIKE ?", [`logs_${channel.replace('#', '')}`]);
            if (!checkChannel.length) {
                return `${user['username']}, I'm not logging this channel, therefore I can't display data for this command :/`;
            }

            // checks if output message is not too long
            class ModifyOutput {
                constructor(input) {
                    this.input = input;
                }

                trimmer() {
                    if (channel === "#forsen" || channel === "#vadikus007") {
                        if (this.input.includes('⣿')) {
                            return ' [braille copypasta]';
                        }
                        return (this.input.length > 93) ? `${this.input.substr(0, 93)}(...)` : this.input;
                    }
                    return this.input.substr(0, 430);
                }
            }

            // kb fl
            if (!msg[0]) {
                const firstline = await custom.query(
                    "SELECT * FROM ?? WHERE username=? LIMIT 1 OFFSET 0",
                    [`logs_${channel.replace('#', '')}`, user['username']]);

                if (!firstline[0]) {
                    return `${user['username']}, I don't have any logs from that user`;
                }

                const timeDifference = (Math.abs(Date.now() - (Date.parse(firstline[0].date)))/1000);

                const result = new ModifyOutput(firstline[0].message);

                return `${user['username']}, Your first line in this channel was:
                (${custom.humanizeDuration(timeDifference)} ago) ${firstline[0].username}: ${result.trimmer()}`;
            }

            // kb fl [#channel]
            const userSpecifiedChannel = msg.find(i=>i.startsWith('#'));

            if (typeof userSpecifiedChannel != "undefined") {
                // handle opted out channels
                if (userSpecifiedChannel === '#supinic' || userSpecifiedChannel === "#haxk") {
                    return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
                }

                const checkIfLogging = await custom.query("SHOW TABLES LIKE ?", [`logs_${userSpecifiedChannel.replace('#', '')}`]);
                if (!checkIfLogging.length) {
                    return `${user['username']}, I'm not logging the channel you specified :/`;
                }

                const firstline = await custom.query(
                    "SELECT * FROM ?? WHERE username=? LIMIT 1 OFFSET 0",
                    [`logs_${userSpecifiedChannel.replace('#', '')}`, user['username']]);

                if (!firstline.length) {
                    return `${user['username']}, I don't have any logs from you in that channel FeelsDankMan ..`;
                }

                const timeDifference = (Math.abs(Date.now() - (Date.parse(firstline[0].date)))/1000);

                const result = new ModifyOutput(firstline[0].message);

                return `${user['username']}, Your first line in channel ${userSpecifiedChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                (${custom.humanizeDuration(timeDifference)} ago) ${firstline[0].username}: ${result.trimmer()}`;
            }

            const checkIfOptedOut = await custom.query(`
                SELECT *
                FROM optout
                WHERE command=? AND username=?`,
                ["fl", msg[0].toLowerCase().replace(/@|,/g, '')]);

            if (checkIfOptedOut.length && (user['username'] != msg[0].toLowerCase().replace(/@|,/g, ''))) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

            const checkIfUserExists = await custom.query(`
                SELECT *
                FROM user_list
                WHERE username=?`,
                [msg[0].toLowerCase().replace(/@|,/g, '')]);

            if (!checkIfUserExists.length) {
                return `${user['username']}, this user does not exist in my user list logs.`;
            }

            // check if user exists in the database
            const firstLine = await custom.query(`
                SELECT *
                FROM logs_${channel.replace('#', '')}
                WHERE username=?
                LIMIT 1
                OFFSET 0`,
                [msg[0].toLowerCase().replace(/@|,/g, '')]);

            if (!firstLine.length) {
                return `${user['username']}, I don't have any logs from that user`;
            }

            const timeDifference = (Math.abs(Date.now() - (Date.parse(firstLine[0].date)))/1000);

            const result = new ModifyOutput(firstLine[0].message);

            return `${user['username']}, first line of that user in this channel:
            (${custom.humanizeDuration(timeDifference)} ago) ${firstLine[0].username}: ${result.trimmer()}`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}