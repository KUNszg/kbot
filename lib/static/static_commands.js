#!/usr/bin/env node
'use strict';

// first connection to database to receive channel list
// this should be moved into another module and reworked
const kb = require('../handler.js').kb
const custom = require('../utils/functions.js');
const got = require('got');
const repeatedMessages = {
    supinic: null
};
const talkedRecently = new Set();
const talkedRecently2 = new Set();
const dankeval = [
    {
        name: 'HONEYDETECTED',
        aliases: null,
        invocation: async (channel, user) => {
            if (user['user-id'] != '68136884') {
                return '';
            }
            return 'HONEYDETECTED POŁĄCZONO PONOWNIE KKurwa 7';
        }
    },

    {
        name: '?cookie',
        aliases: '!cookie',
        invocation: async (channel, user) => {
            try {

                if (talkedRecently.has(user['user-id'])) {
                    return '';
                } else {
                    talkedRecently.add(user['user-id']);
                    setTimeout(() => {
                        talkedRecently.delete(user['user-id']);
                    }, 1000);
                }

                const getAlias = await custom.doQuery(`
                    SELECT *
                    FROM user_list
                    WHERE userId=${user['user-id']}
                    `);
                if (!getAlias.length) {
                    return '';
                }

                const cookieModule = await custom.doQuery(`
                    SELECT reminders
                    FROM cookieModule
                    WHERE type="cookie"
                    `);
                if (cookieModule[0].reminders === "false") {
                    return '';
                }
                const query = await custom.doQuery(`
                    SELECT *
                    FROM cookie_reminders
                    WHERE user_alias="${getAlias[0].ID}"
                    `);

                const userChannel = `#${user['username']}`;
                const channelNoPing = channel.replace(/^(.{2})/, "$1\u{E0000}");
                if (!query.length) {
                    return '';
                }

                const cookieApi = await got(`https://api.roaringiron.com/cooldown/${user['user-id']}?id=true`).json();

                Date.prototype.addMinutes = function(minutes) {
                    const copiedDate = new Date(this.getTime());
                    return new Date(copiedDate.getTime() + minutes * 1000);
                }

                if (!cookieApi || typeof cookieApi.seconds_left === "undefined") {
                    return ''
                }

                if (cookieApi.seconds_left < cookieApi.interval_unformatted-20 || cookieApi.seconds_left === 0) {
                    if (!cookieApi.time_left_formatted) {
                        return '';
                    }

                    kb.whisper(user['username'], `Your cookie is still on cooldown (${cookieApi.time_left_formatted}) with ${cookieApi.interval_formatted} intervals.`);
                    return '';
                } else {
                    await custom.doQuery(`
                        UPDATE cookie_reminders
                        SET cookie_count="${query[0].cookie_count + 1}"
                        WHERE user_alias="${getAlias[0].ID}"
                        `);

                    const now = new Date();

                    const timestamp = now
                        .addMinutes(cookieApi.interval_unformatted)
                        .toISOString()
                        .slice(0, 19)
                        .replace('T', ' ');

                    await custom.doQuery(`
                        UPDATE cookie_reminders
                        SET channel="${channel.replace('#', '')}",
                            fires="${timestamp}",
                            status="scheduled"
                        WHERE user_alias="${getAlias[0].ID}"
                        `);

                    if (query[0].initplatform === "channel") {
                        if (query[0].status === "scheduled") {
                            kb.say(userChannel, `${user['username']}, updating your pending cookie reminder,
                                I will remind you in ${cookieApi.interval_formatted}
                                (channel ${channelNoPing}) :D`);
                        } else {
                            kb.say(userChannel, `${user['username']}, I will remind you to eat the cookie in
                                ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`);
                        }
                    } else if (query[0].initplatform === "whisper") {
                        if (query[0].status === "scheduled") {
                            kb.whisper(user['username'], `updating your pending cookie reminder,
                                I will remind you in ${cookieApi.interval_formatted}
                                (channel ${channelNoPing}) :D`);
                        } else {
                            kb.whisper(user['username'], `I will remind you to eat the
                                cookie in ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`);
                        }
                    } else if (query[0].initplatform === "silence") {
                        return '';
                    }
                }
                return '';
            } catch (err) {
                custom.errorLog(err);
                return  `${user['username']}, the cookie API is down, don't panic monkaS / 🐴 `;
            }
        }
    },

    {
        name: "+ed",
        aliases: "+enterdungeon",
        invocation: async (channel, user) => {
            try{
                const sleep = (milliseconds) => {
                    const start = new Date().getTime();
                    for (var i = 0; i < 1e7; i++) {
                        if ((new Date().getTime() - start) > milliseconds) {
                            break;
                        }
                    }
                }
                sleep(1500);

                if (talkedRecently2.has(user['user-id'])) {
                    return '';
                } else {
                    talkedRecently2.add(user['user-id']);
                    setTimeout(() => {
                        talkedRecently2.delete(user['user-id']);
                    }, 1000);
                }

                const checkIfBotIsJoined = await got('https://huwobot.me/api/channels').json()
                const checkChannels = checkIfBotIsJoined.filter(i => i === channel.replace('#', ''));
                if (!checkChannels.length) {
                    return '';
                }

                const cookieModule = await custom.doQuery(`
                    SELECT reminders
                    FROM cookieModule
                    WHERE type="ed"
                    `);

                if (cookieModule[0].reminders === "false") {
                    return '';
                }

                const getUserAlias = await custom.doQuery(`
                    SELECT *
                    FROM user_list
                    WHERE userId="${user['user-id']}"
                    `);
                if (!getUserAlias.length) {
                    return '';
                }

                const getUserData = await custom.doQuery(`
                    SELECT *
                    FROM ed_reminders
                    WHERE user_alias="${getUserAlias[0].ID}"
                    `)
                if (!getUserData.length) {
                    return '';
                }

                Date.prototype.addMinutes = function(minutes) {
                    var copiedDate = new Date(this.getTime());
                    return new Date(copiedDate.getTime() + minutes * 1000);
                }

                const getEdData = await got(`https://huwobot.me/api/user?id=${user['user-id']}`).json();

                if (typeof getEdData.next_entry === "undefined") {
                    return `${user['username']}, you are not registered for huwobot's reminders Pepega`;
                }

                const now = new Date();
                const timeDiff = getEdData.next_entry - getEdData.last_entry;

                if (getUserData[0].initPlatform === "silence") {
                    await custom.doQuery(`
                        UPDATE ed_reminders
                        SET channel="${channel.replace('#', '')}",
                            fires="${now.addMinutes(timeDiff.toFixed(0)).toISOString().slice(0, 19).replace('T', ' ')}",
                            status="scheduled",
                            count=${getUserData[0].count + 1}
                        WHERE user_alias="${getUserAlias[0].ID}"
                        `);
                    return '';
                }
                // check if ed is still pending
                if (getEdData.next_entry.toFixed(0) > (Date.now(new Date())/1000) &&
                    (getEdData.next_entry.toFixed(0) - (Date.now(new Date())/1000))<3565) {
                        kb.whisper(user['username'], `Your dungeon entry is still on cooldown
                            (${custom.secondsToDhms(getEdData.next_entry.toFixed(0) - (Date.now(new Date())/1000))})
                            to force-set your reminder use "kb ed force".`)
                        return '';
                }

                kb.whisper(user['username'], `I will remind you to enter the dungeon in ${custom.secondsToDhms(timeDiff)} :)`);

                await custom.doQuery(`
                    UPDATE ed_reminders
                    SET channel="${channel.replace('#', '')}",
                        fires="${now.addMinutes(timeDiff.toFixed(0)).toISOString().slice(0, 19).replace('T', ' ')}",
                        status="scheduled",
                        count=${getUserData[0].count + 1}
                    WHERE user_alias="${getUserAlias[0].ID}"
                    `);
                return '';
            } catch (err) {
                kb.say(channel, '@kunszg, monkaS ' + err)
                custom.errorLog(err);
            }
        }
    },

    {
        name: '$ps',
        aliases: null,
        invocation: async (channel, user, message) => {
            try {

                if (talkedRecently2.has(user['user-id'])) {
                    return '';
                } else {
                    talkedRecently2.add(user['user-id']);
                    setTimeout(() => {
                        talkedRecently2.delete(user['user-id']);
                    }, 10000);
                }
                const msg = custom.getParam(message, 1);

                if (!msg[0]) {
                    return '';
                }

                const getPSData = await custom.doQuery(`
                    SELECT *
                    FROM playsounds
                    WHERE name="${msg[0]}"
                    `);
                if (!getPSData.length) {
                    return '';
                }
                if (getPSData[0].last_executed === 'null' || (Date.parse(getPSData[0].last_executed) - Date.parse(new Date()))/1000 > 1) {
                    return '';
                }
                Date.prototype.addSeconds= function(seconds) {
                    var copiedDate = new Date(this.getTime());
                    return new Date(copiedDate.getTime() + seconds * 1000);
                }
                const now = new Date();
                await custom.doQuery(`
                    UPDATE playsounds
                    SET last_executed="${now.addSeconds(getPSData[0].cooldown/1000).toISOString().slice(0, 19).replace('T', ' ')}"
                    WHERE name="${msg[0]}"
                    `);

                return '';

            } catch (err) {
                custom.errorLog(err);
            }
        }
    },
];

kb.on("chat", async (channel, user, message, self) => {
    if (self) return;
    dankeval.forEach(async smart => {
        if ((message.split(' ')[0] === smart.name) ||
            (smart.aliases && message.split(' ')[0] === smart.aliases)) {
            let result = await smart.invocation(channel, user, message);

            if (channel === '#forsen') {
                return;
            }
            const checkChannelStatus = await custom.doQuery(`
                SELECT *
                FROM channels
                WHERE channel="${channel.replace('#', '')}"
                `)

            if (checkChannelStatus[0].status === "live" && (checkChannelStatus[0].channel === "nymn" ||
                checkChannelStatus[0].channel === "pajlada") ) {
                return;
            }

            if (!result) {
                kb.say(channel, '');
            }
            if (result === "undefined") {
                kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
                return;
            } else {
                if (result === '') {
                    kb.say(channel, '')
                    return;
                } else if (repeatedMessages[channel] === result) {
                    result += " \u{E0000}";
                }
            }
            repeatedMessages[channel] = result;
            if (result === "undefined") {
                return;
            }
            kb.say(channel, result.toString());
        }
    });
});

kb.on('chat', async (channel, user, message) => {
    if (message.startsWith('`')) {

        if (await custom.checkPermissions(user['username'])<4) {
            return '';
        }

        const msgChannel = message
            .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
            .replace('`', '')
            .split(' ')[0];

        const msg = message
            .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
            .split(' ')
            .splice(1)
            .join(' ')

        if (!msg) {
            kb.say(channel, `${user['username']}, no message provided.`);
        }
        kb.say(msgChannel, msg)
    }
    return;
})

kb.on('chat', async (channel, user, message, self) => {
    if (self) {
        return;
    }
    if (channel === "#phayp" && message.split(' ')[0] === "test") {
        kb.say('phayp', 'nymnHappy <3 test successfull');
        return;
    }
    if (channel === '#kunszg') {
        let checkUsersPinged = require('./chatters.js').chatters;

        const userList = checkUsersPinged[0][channel.replace('#', '')].filter(i => message.split(' ').includes(i))

        if (userList.length>6) {
            kb.say(channel, `/timeout ${user['username']} 10m massping`);
            kb.say(channel, `${user['username']}, masspinging innocent people KEKQuestion`);
            return;
        }

        if (message.match(/vanish/g)) {
            kb.say(channel, `/timeout ${user['username']} 1s`);

            const emotes = [
                'peepoSad',
                'peepoDone',
                'KEKFbi',
                'XQCJUMPSINTOBED',
                'KEKYEP',
                'KEKShrug',
                'KEKQuestion'
            ];
            const randomEmote = custom.random(emotes);

            kb.say(channel, `${user['username']} just vanished ${randomEmote}`);
        }
        return;
    }
    if (channel === "#supinic" && message.split(' ')[0] === '!s') {
        const activeChatters = await got(`https://tmi.twitch.tv/group/user/supinic/chatters`).json();
        if (!activeChatters.chatters.broadcaster.length) {
            kb.say(channel, 'ppL');
        } else {
            kb.say(channel, 'monkaS 👉 HACKERMANS ');
        }
        return;
    }

    if (channel === '#haxk' && message.split(' ')[0] === '!h') {
        const activeChatters = await got(`https://tmi.twitch.tv/group/user/haxk/chatters`).json();
        if (!activeChatters.chatters.broadcaster.length) {
            kb.say(channel, 'ppL');
        } else {
            kb.say(channel, 'monkaS');
        }
        return;
    }

    if (channel === '#haxk' && message === "!xd") {
        kb.say('haxk', "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛⠛⠛⠛⠛⠛⠿⠿⣿⣿⣿⣿⣿" +
                      " ⣿⣿⣯⡉⠉⠉⠙⢿⣿⠟⠉⠉⠉⣩⡇⠄⠄⢀⣀⣀⡀⠄⠄⠈⠹⣿⣿⣿" +
                      " ⣿⣿⣿⣷⣄⠄⠄⠈⠁⠄⠄⣠⣾⣿⡇⠄⠄⢸⣿⣿⣿⣷⡀⠄⠄⠘⣿⣿" +
                      " ⣿⣿⣿⣿⣿⣶⠄⠄⠄⠠⣾⣿⣿⣿⡇⠄⠄⢸⣿⣿⣿⣿⡇⠄⠄⠄⣿⣿" +
                      " ⣿⣿⣿⣿⠟⠁⠄⠄⠄⠄⠙⢿⣿⣿⡇⠄⠄⠸⠿⠿⠿⠟⠄⠄⠄⣰⣿⣿" +
                      " ⣿⡿⠟⠁⠄⢀⣰⣶⣄⠄⠄⠈⠻⣿⡇⠄⠄⠄⠄⠄⠄⠄⢀⣠⣾⣿⣿⣿" +
                      " ⣿⣷⣶⣶⣶⣿⣿⣿⣿⣷⣶⣶⣶⣿⣷⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿ "
                      );
    } else if (channel==="#supinic" && (message === "$ps sneeze" || message === "$playsound sneeze")) {
        if (talkedRecently.has(user['user-id'])) {
            return;
        } else {
            talkedRecently.add(user['user-id']);
            setTimeout(() => {
                talkedRecently.delete(user['user-id']);
            }, 5000);
        }
        const sleep = (milliseconds) => {
            const start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        }
        sleep(1000);
        kb.say('supinic', ' bless u peepoSpookDank');
        return;
    } else {
        return;
    }
});

kb.on("timeout", (channel, username, message, duration) => {
    if (channel != "#supinic") {
        return;
    } else {
        if (duration == '1') {
            kb.say(channel, username + " vanished Article13 MagicTime")
        } else {
            kb.say(channel, username + " has been timed out for " + duration + "s Article13 MagicTime")
        }
    }
});

kb.on("ban", (channel, username) => {
    if (channel != "#supinic") return;
    else
        kb.say("supinic", username + " has been permanently banned pepeMeltdown")
});

kb.on("hosted", (channel, username, viewers) => {
    if (channel === "#supinic")  {
        kb.say("supinic", username + " hosted supinic with " + viewers + " viewers HACKERMANS ");
        return;
    }
});

kb.on("clearchat", (channel) => {
    if (channel === "#kunszg") {
        kb.say('kunszg', 'MODS clean the chat');
        return;
    }
});