#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js');

module.exports = {
    name: "kb fl",
    invocation: async (channel, user, message, args) => {
        try {
            const msg = custom.getParam(message)

            const checkChannel = await custom.doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
            if (!checkChannel.length) {
                return `${user['username']}, I'm not logging this channel,
                therefore I can't display data for this command :/`;
            }

            if (!msg[0]) {
                const firstline = await custom.doQuery(`
                    SELECT *
                    FROM logs_${channel.replace('#', '')}
                    WHERE username="${user['username']}"
                    LIMIT 1
                    OFFSET 0`
                    );
                if (!firstline[0]) {
                    return `${user['username']}, I don't have any logs from that user`;
                }

                function modifyOutput(modify) {
                    if (!modify) {
                        return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                        ${firstline[0].message.substr(0, 440)}`;
                    } else {
                        return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                        ${firstline[0].message.substr(0, modify)}`;
                    }
                }

                const serverDate = new Date().getTime();
                const timeDifference = (Math.abs(serverDate -
                    (new Date(firstline[0].date).getTime())))/1000/3600;
                const timeDifferenceRaw = (Math.abs(serverDate - (new Date(firstline[0].date).getTime())));

                if (await custom.banphrasePass(firstline[0].message, channel.replace('#', '')).banned) {
                    if (channel==="#nymn" || channel==="#forsen") {
                        if (timeDifference>48) {
                            bot.kb.whisper(user['username'], `, Your first line in this channel was:
                                (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`);
                        } else {
                            bot.kb.whisper(user['username'], `, Your first line in this channel was:
                                (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`);
                        }
                        return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
                    }

                    if (timeDifference>48) {
                        return `${user['username']}, Your first line in this channel was:
                        (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                    }
                    return `${user['username']}, Your first line in this channel was:
                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;
                }

                if (channel === "#nymn" || channel === "#forsen") {
                    if (timeDifference>48) {
                        return `${user['username']}, Your first line in this channel was:
                        (${(timeDifference/24).toFixed(0)}d ${modifyOutput(440)}`;
                    }
                    return `${user['username']}, Your first line in this channel was:
                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput(440)}`;
                }

                if (timeDifference>48) {
                    return `${user['username']}, Your first line in this channel was:
                    (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                }
                return `${user['username']}, Your first line in this channel was:
                (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;

            } else {

                // check if user points to other channel
                const getChannel = msg.find(i=>i.startsWith('#'));
                if (typeof getChannel != 'undefined') {
                    if (getChannel === '#supinic' || getChannel === "#haxk") {
                        return `${user['username']}, specified channel is opted out from being a target of this command flag.`;
                    }
                    // check if user exists in the database
                    const checkChannel2 = await custom.doQuery(`SHOW TABLES LIKE "logs_${getChannel.replace('#', '')}"`)

                    if (!checkChannel2.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }
                    const firstline = await custom.doQuery(`
                        SELECT *
                        FROM logs_${getChannel.replace('#', '')}
                        WHERE username="${user['username']}"
                        LIMIT 1
                        OFFSET 0`
                        );
                    if (!firstline[0]) {
                        return `${user['username']}, I don't have any logs from that user`;
                    }

                    function modifyOutput(modify) {
                        if (!modify) {
                            return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                            ${firstline[0].message.substr(0, 440)}`;
                        } else {
                            return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                            ${firstline[0].message.substr(0, modify)}`;
                        }
                    }

                    const serverDate = new Date().getTime();
                    const timeDifference = (Math.abs(serverDate -
                        (new Date(firstline[0].date).getTime())))/1000/3600;
                    const timeDifferenceRaw = (Math.abs(serverDate - (new Date(firstline[0].date).getTime())));

                    if (await custom.banphrasePass(firstline[0].message, channel.replace('#', '')).banned) {
                        if (channel==="#nymn" || channel==="#forsen") {
                            if (timeDifference>48) {
                                bot.kb.whisper(user['username'], `, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                                    (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`);
                            } else {
                                bot.kb.whisper(user['username'], `, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`);
                            }
                            return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
                        }

                        if (timeDifference>48) {
                            return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                            (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                        }
                        return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                        (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;
                    }

                    if (channel === "#nymn" || channel === "#forsen") {
                        if (timeDifference>48) {
                            return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                            (${(timeDifference/24).toFixed(0)}d ${modifyOutput(440)}`;
                        }
                        return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                        (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput(440)}`;
                    }

                    if (timeDifference>48) {
                        return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                        (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                    }
                    return `${user['username']}, Your first line in channel ${getChannel.replace(/^(.{2})/, "$1\u{E0000}")} was:
                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;

                }
                // check if user exists in the database
                const checkIfUserExists = await custom.doQuery(`
                    SELECT *
                    FROM user_list
                    WHERE username="${msg[0]}"
                    `);
                if (!checkIfUserExists.length) {
                    return `${user['username']}, this user does not exist in my user list logs.`;
                }

                const sql = `SELECT * FROM logs_${channel.replace('#', '')} WHERE username=? LIMIT 1 OFFSET 0`;
                const inserts = [msg[0]];
                const mysql = require('mysql2')
                const firstline = await custom.doQuery(mysql.format(sql, inserts));

                if (!firstline[0]) {
                    return `${user['username']}, I don't have any logs from that user`;
                }

                function modifyOutput(modify) {
                    if (!modify) {
                        return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                        ${firstline[0].message.substr(0, 440)}`;
                    } else {
                        return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
                        ${firstline[0].message.substr(0, modify)}`;
                    }
                }

                const serverDate = new Date().getTime();
                const timeDifference = (Math.abs(serverDate -
                    (new Date(firstline[0].date).getTime())))/1000/3600;
                const timeDifferenceRaw = (Math.abs(serverDate -
                    (new Date(firstline[0].date).getTime())));

                if (await custom.banphrasePass(firstline[0].message, channel.replace('#', '')).banned) {
                    if (channel==="#nymn" || channel==="#forsen") {
                        if (timeDifference>48) {
                            bot.kb.whisper(user['username'], `, first line of that user in this channel:
                                (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`);
                        } else {
                            bot.kb.whisper(user['username'], `, first line of that user in this channel:
                                (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`);
                        }
                        return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
                    }

                    if (timeDifference>48) {
                        return `${user['username']}, first line of that user in this channel:
                        (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                    }
                    return `${user['username']}, first line of that user in this channel:
                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;
                }

                if (channel === "#nymn" || channel==="#forsen") {
                    if (timeDifference>48) {
                        return `${user['username']}, first line of that user in this channel:
                        (${(timeDifference/24).toFixed(0)}d ${modifyOutput(440)}`;
                    }
                    return `${user['username']}, first line of that user in this channel:
                    (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput(440)}`;
                }

                if (timeDifference>48) {
                    return `${user['username']}, first line of that user in this channel:
                    (${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
                }
                return `${user['username']}, first line of that user in this channel:
                (${custom.format(timeDifferenceRaw/1000)} ${modifyOutput()}`;
            }
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}