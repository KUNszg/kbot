#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const mysql = require('mysql2');

// allow only one execution at the same time (globally)
const stallTheCommand = new Set();

module.exports = {
    stall: stallTheCommand,
    name: 'kb stats',
    invocation: async (channel, user, message, platform) => {
        try {
            if (stallTheCommand.has('busy')) {
                return '';
            }
            stallTheCommand.add('busy');
            setTimeout(()=>{
                stallTheCommand.clear();
            }, 60000);

            const msg = utils.getParam(message.replace(/[^-?]\bcolor\b/, ' stats -color').replace(/[^-?]\bcolour\b/, ' stats -color'));

            // check for internal banphrases
            const getInternalBans = await utils.query(`SELECT * FROM internal_banphrases`);

            const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase));

            if (checkIfBanned.length && utils.strictChannels(channel)) {
                return `${user['username']}, I cannot search with this query,
                it contains an internally banned phrase.`;
            }

            this.channel = channel.replace('#', '');

            const checkChannel = await utils.query(
                "SHOW TABLES LIKE ?",
                [`logs_${this.channel}`]);

            if (!checkChannel.length) {
                return `${user['username']}, I'm not logging this channel,
                therefore I can't display stats for it :/`;
            }

            /* kb stats */
            const stats = async() => {
                if (channel === "#forsen" || channel === "#vadikus007") {
                    kb.whisper(user['username'], 'this syntax is disabled in this channel due to overload, it might come back at some point when its fixed. You can still use: kb stats -bruh, kb stats -channel, kb stats -lines etc.');
                    return '';
                }

                // all lines in the channel
                const occurence = await  utils.query(`
                    SELECT MAX(ID) as value
                    FROM ??`,
                    [`logs_${this.channel}`])

                // channel lines occurence
                const val = await utils.query(`
                    SELECT message, COUNT(message) AS value_occurance
                    FROM ??
                    WHERE username=? AND (
                        message NOT LIKE "?%"
                        AND message NOT LIKE "+%"
                        AND message NOT LIKE "kb%"
                        AND message NOT LIKE "$%"
                        AND message NOT LIKE "!%"
                        AND message NOT LIKE "&%"
                        AND message NOT LIKE "-%"
                        )
                    GROUP BY message
                    ORDER BY value_occurance
                    DESC
                    LIMIT 1;`,
                    [`logs_${this.channel}`, user['username']])

                if (!val.length) {
                    return `${user['username']}, no results were found`;
                }

                // manage the output message lengths
                const modifyOutput = async(modify) => {
                    if (channel==="#nymn" || channel === "#vadikus007") {
                        return `${user['username']}, your most frequently typed message: "
                        ${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
                    }

                    const values = await utils.query(`
                        SELECT COUNT(username) as value
                        FROM ??
                        WHERE username=?`,
                        [`logs_${this.channel}`, user['username']]);

                    if (Number(val[0].value_occurance) <= 3) {
                        return `${user['username']}, you have total of ${values[0].value} lines logged,
                        that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                        of all lines in this channel.`;
                    }

                    return `${user['username']}, you have total of ${values[0].value} lines logged,
                    that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                    of all lines in this channel, your most frequently typed message: "
                    ${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
                }

                if (utils.strictChannels(channel)) {
                    return modifyOutput(100);
                }
                return modifyOutput(250);
            }

            /* kb stats @[user] [message] */
            const statsUser =  async() => {
                if (channel === "#forsen" || channel === "#vadikus007") {
                    kb.whisper(user['username'], 'this syntax is disabled in this channel due to overload, it might come back at some point when its fixed. You can still use: kb stats -bruh, kb stats -channel, kb stats -lines etc.');
                    return '';
                }
                // check if user exists in the database
                const checkIfUserExists = await utils.query(`
                    SELECT * FROM user_list
                    WHERE username=?`,
                    [msg.filter(i=>i.startsWith('@'))[0].replace('@', '').replace(',', '')]);

                if (!checkIfUserExists.length) {
                    return `${user['username']}, this user does not exist in my user list logs.`;
                }

                // check if user provided a user in flag
                if (!msg.filter(i => i.startsWith('@'))[0].replace('@', '').replace(',', '').length) {
                    return `${user['username']}, wrong flag syntax, no user after "@" provided`;
                }

                // check if user provided enough characters
                if (msg.filter(i => !i.startsWith('@')).join(' ').length<3) {
                    if (!msg.filter(i => !i.startsWith('@')).join(' ').length) {
                        return `${user['username']}, you did not provide any phrase.
                        (usage example: kb stats @kunszg hello)`;
                    }
                    return `${user['username']}, provided word has not enough characters to run a query.`;
                }

                if (channel != "#nymn") {
                    // get the message
                    const sql = `
                        SELECT t.*
                        FROM logs_${this.channel} AS t
                        INNER JOIN
                            (SELECT ROUND(
                               RAND() * (SELECT MAX(ID) FROM logs_${this.channel} )) AS id
                             ) AS x
                        WHERE
                            t.id >= x.id AND username=? AND message LIKE ?
                        LIMIT 1`;
                    const select = [
                        msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
                        '%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
                        ];

                    // get the occurence
                    const sql2 = `
                        SELECT username, message, COUNT(*) AS value
                        FROM logs_${this.channel}
                        WHERE username=? AND message LIKE ?`;
                    const select2 = [
                        msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
                        '%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
                        ];

                    const response = await Promise.all([
                        utils.doQuery(mysql.format(sql, select)),
                        utils.doQuery(mysql.format(sql2, select2))
                        ]);

                    // check if there are any logs for specified user
                    if (!response[0].length || !Number(response[0].value)) {
                        return `${user['username']}, no message logs found for that query
                        or related to that user.`;
                    }

                    // limit message length
                    const modifyOutput = (modify) => {
                        return `${user['username']}, messages similar to
                        " ${response[0][0].message.substr(0, modify)} " have been typed
                         ${response[1][0].value} times in this channel by user
                         ${response[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
                    }

                    // for channels marked as strict
                    if (utils.strictChannels(channel)) {
                        return modifyOutput(50);
                    }
                    return modifyOutput(250);
                }
                else {
                    const rows = await utils.query(`
                        SELECT *
                        FROM ??
                        WHERE username = ? AND message LIKE ?`,
                        [
                            `logs_${this.channel}`,
                            msg.filter(i => i.startsWith('@'))[0].replace('@', ''),
                            '%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%'
                        ]);

                    if (!rows.length) {
                        return `${user['username']}, no message logs found for that query
                        or related to that user.`;
                    }

                    const randomRow = utils.random(rows);

                    const modifyOutput = (modify) => {
                        return `${user['username']}, messages similar to
                        " ${randomRow.message.substr(0, modify)} " have been typed
                         ${rows.length} times in this channel by user
                         ${randomRow.username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
                    }

                    // for channels marked as strict
                    if (utils.strictChannels(channel)) {
                        return modifyOutput(80);
                    }
                    return modifyOutput(250);
                 }
            }

            /* kb stats [message] */
            const statsMessage = async() => {
                if (channel === "#forsen") {
                    kb.whisper(user['username'], 'this syntax is disabled in this channel due to overload, you can still use: kb stats -bruh, kb stats -channel, kb stats -lines etc.');
                    return '';
                }
                if (!msg) {
                    kb.whisper('kunszg', message)
                    return `${user['username']}, internal error has occured monkaS @kunszg [#err_statsMessage]`;
                }

                // check if query has enough characters
                if (msg.join(' ').length<5) {
                    return `${user['username']}, provided word has not enough characters to run a query.`;
                }

                // positional query
                const sql = `
                    SELECT t.message
                    FROM logs_${this.channel} AS t
                    INNER JOIN
                        (SELECT ROUND(
                           RAND() *
                          (SELECT MAX(ID) FROM logs_${this.channel} )) AS id
                         ) AS x
                    WHERE
                        t.id >= x.id AND MATCH(message) AGAINST (?)
                    ORDER BY RAND() LIMIT 1
                    `;
                const inserts = [`'"*${msg.join(' ')}*"'`];

                const sql2 = `
                    SELECT count(*) AS value_occurance
                    FROM logs_${this.channel}
                    WHERE MATCH(message) AGAINST (?);
                    `;
                const inserts2 = [`'"*${msg.join(' ')}*"'`];

                const occurence = await Promise.all([
                    utils.doQuery(mysql.format(sql, inserts)),
                    utils.doQuery(mysql.format(sql2, inserts2))
                    ])

                // check if there are any message logs for given query
                if (!occurence[0].length) {
                    return `${user['username']}, no message logs found for that query`;
                }

                function modifyOutput(modify) {
                    return `${user['username']}, messages similar to
                    " ${occurence[0][0].message.substr(0, modify)} " have been typed
                    ${occurence[1][0].value_occurance} times in this channel.`;
                }

                if (utils.strictChannels(channel)) {
                    return modifyOutput(75);
                }
                return modifyOutput(250);
            }

            /* kb stats -channel */
            const statsChannel = async() => {
                if (msg[1]) {
                    const checkChannels = await utils.query(`
                        SELECT *
                        FROM channels_logger
                        WHERE channel=?`,
                        [msg[1].replace('#', '')]);

                    if (!checkChannels.length) {
                        return `${user['username']}, I don't have any logs from that channel :P`;
                    }

                    const channelData = await Promise.all([
                        // amount of rows
                        utils.query(`
                            SELECT MAX(ID) AS value
                            FROM ??`,
                            [`logs_${msg[1].replace('#', '')}`]),

                        // table size
                        utils.query(`
                            SELECT TABLE_NAME
                                AS ` + '`' + 'Table' + '`' + `, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024
                                AS size FROM information_schema.TABLES
                            WHERE TABLE_NAME = ?
                            ORDER BY (DATA_LENGTH + INDEX_LENGTH)
                            DESC;`,
                            [`logs_${msg[1].replace('#', '')}`]),

                        // create time
                        utils.query(`
                            SELECT date AS create_time
                            FROM ??
                            LIMIT 1
                            OFFSET 0`,
                            [`logs_${msg[1].replace('#', '')}`])
                    ]);
                    // date formatting
                    const logsDate = new Date(channelData[2][0].create_time);
                    const date = Math.abs(new Date() - logsDate)/1000;

                    return `${user['username']}, channel ${msg[1].replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")}
                    has ${channelData[0][0].value} lines logged, which is ${Number(channelData[1][0].size).toFixed(0)} MB total.
                    Logs in that channel started ${(date/86400).toFixed(0)} days ago.`;
                }

                const channelData = await Promise.all([
                    // amount of rows
                    utils.query(`
                        SELECT MAX(ID) AS value
                        FROM ??`,
                        [`logs_${this.channel}`]),

                    // table size
                    utils.query(`
                        SELECT TABLE_NAME
                            AS ` + '`' + 'Table' + '`' + `, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024
                            AS size FROM information_schema.TABLES
                        WHERE TABLE_NAME = ?
                        ORDER BY (DATA_LENGTH + INDEX_LENGTH)
                        DESC;`,
                        [`logs_${this.channel}`]),

                    // create time
                    utils.query(`
                        SELECT date AS create_time
                        FROM ??
                        LIMIT 1
                        OFFSET 0`,
                        [`logs_${this.channel}`])
                ])
                // date formatting
                const logsDate = new Date(channelData[2][0].create_time);
                const date = Math.abs(new Date() - logsDate)/1000;

                return `${user['username']}, this channel has ${channelData[0][0].value}
                lines logged, which is ${Number(channelData[1][0].size).toFixed(0)} MB total.
                Logs in this channel started ${(date/86400).toFixed(0)} days ago.`;
            }

            /* kb stats -bruh */
            const statsBruh = async() => {
                if (channel === "#vadikus007") {
                    return `${user['username']}, this command flag is no longer available in this channel :(`;
                }

                const countResults = await utils.query(`
                    SELECT *
                    FROM bruh
                    WHERE channel=?`,
                    [channel.replace('#', '')]);

                // kb stats -bruh
                if (!msg[1]) {
                    if (channel === '#haxk') {
                        // results for sender
                        const countResultsUser = countResults.filter(i => i.username === user['username'])

                        if (countResultsUser.length<2 && countResultsUser.length != 1) {
                            return `${user['username']}, you have spelled it ${countResultsUser.length} times,
                            we coo TriHard - total of ${countResults.length} n bombs in this channel and
                            TriChomp TeaTime`;
                        }

                        return `${user['username']}, you have spelled it ${countResultsUser.length}
                        times TriChomp Clap - total of ${countResults.length} n bombs in this channel
                        TriChomp TeaTime`;
                    }

                    if (channel === "#nymn") {
                        return `${user['username']}, total of ${countResults.length} heated gaming moments
                        in this channel cmonBruh`;
                    }

                    if (channel === "#forsen") {
                        return `${user['username']}, total of ${countResults.length} unpleasant people
                        in this channel cmonBruh`;
                    }

                    if (!countResults.length) {
                        return `${user['username']}, no heated gaming moments detected in this channel, we coo RlyTho Clap`;
                    }

                    return `${user['username']}, total of ${countResults.length} heated gaming moments
                    in this channel cmonBruh`;
                }

                if (msg.includes('#all')) {
                    const countAllResults = await utils.query(`
                        SELECT COUNT(*) as count
                        FROM bruh`);

                    const channelCount = await  utils.query(`
                        SELECT COUNT(*) as count
                        FROM channels_logger`);

                    const rowsToday = await utils.query(`
                        SELECT COUNT(*) AS count
                        FROM bruh
                        WHERE DATE(date) = CURDATE()`);

                    return `${user['username']}, there is ${countAllResults[0].count} (+${rowsToday[0].count} today) bad words registered so
                    far over all (${channelCount[0].count}) logged channels.`;
                }

                if (msg[1].toLowerCase() === 'apollo' && channel === "#nymn") {
                    const getCount = await utils.query(`
                        SELECT *
                        FROM stats
                        WHERE type="counter"`);

                    await utils.query(`
                        UPDATE stats
                        SET count=?
                        WHERE sha="apollo"`,
                        [Number(getCount[0].count)+Number((Math.random()*10).toFixed(0))]);

                    return `${user['username']}, Apollo has said it ${getCount[0].count} times TriSad`
                }

                // kb stats -bruh [#channel]
                const channelParse = msg.find(i => i.startsWith('#'))
                if (typeof channelParse != "undefined") {
                    const checkChannel = await utils.query(`SHOW TABLES LIKE ?`, [`logs_${channelParse.replace('#', '')}`]);

                    if (!checkChannel.length) {
                        return `${user['username']}, I'm not logging this channel,
                        therefore I can't display stats for it :/`;
                    }

                    const channelData = await utils.query(`
                        SELECT COUNT(*) As bruh
                        FROM bruh
                        WHERE channel=?`,
                        [channelParse.replace('#', '').toLowerCase()]);

                    const channelList = [
                        "#supinic",
                        "#kunszg",
                        "#haxk",
                        "#okabar",
                        "#teodorv",
                    ];

                    if (channelList.includes(channelParse.toLowerCase()) && channel != channelParse.toLowerCase()) {
                        return `${user['username']}, specified channel is opted out from being a target of this command.`;
                    }

                    return `${user['username']}, this channel has total of ${channelData[0].bruh} bruh moments recorded 😩`;
                }

                // kb stats -bruh [user]

                this.msg = msg[1].toLowerCase().replace('@', '').replace(',', '');

                // check if user exists in the database
                const checkIfUserExists = await utils.query(`
                    SELECT *
                    FROM user_list
                    WHERE username=?`,
                    [this.msg]);

                // check if channel exists in user_list logs
                if (!checkIfUserExists.length) {
                    return `${user['username']}, that user does not exist in my user list logs.`;
                }

                if (this.msg.toLowerCase() === 'teodorv' || this.msg.toLowerCase() === 'phzeera') {
                    return `${user['username']}, that user has opted out from this command.`;
                }

                // replace second character in user's name with an invisible character to prevent the ping
                const userNoPing = this.msg.replace(/^(.{2})/, "$1\u{E0000}");

                const countResultsUser = countResults.filter(i => i.username === this.msg);

                if (channel === '#haxk') {
                    if (countResultsUser.length<2 && countResultsUser.length != 1) {
                        return `${user['username']}, user ${userNoPing} has a clean record RlyTho Clap`;
                    }
                    return `${user['username']}, user ${userNoPing} has spelled it ${countResultsUser.length}
                    times TriChomp Clap`;
                }

                if (channel === '#forsen') {
                    if (!countResultsUser.length) {
                        return `${user['username']}, user ${userNoPing} has a clean record RlyTho Clap`;
                    }

                    return `${user['username']}, total of ${countResultsUser.length} unpleasant activities
                    by user ${userNoPing} in this channel cmonBruh`;
                }

                if (!countResultsUser.length) {
                    return `${user['username']}, user ${userNoPing} has a clean record RlyTho Clap`;
                }
                return `${user['username']}, total of ${countResultsUser.length} racist activities
                by user ${userNoPing} in this channel cmonBruh`;
            }

            /* kb stats -lines */
            const statsLines = async() => {
                // check if user is provided
                const username = msg.filter(i => i.startsWith('@'))[0];
                // kb stats -lines @[user]
                if (username) {
                    // check if channel is provided
                    const channelName = msg.filter(i => i.startsWith('#'))[0];
                    // kb stats -lines #[channel] @[username]
                    if (channelName) {
                        // check if channel exists in logs
                        const checkChannel = await utils.query(`SHOW TABLES LIKE ?`, [`logs_${channelName.replace('#', '')}`]);

                        if (!checkChannel.length) {
                            return `${user['username']}, I'm not logging this channel,
                            therefore I can't display stats for it :/`;
                        }

                        // check if user exists in user_list logs
                        const checkIfUserExists = await utils.query(`
                            SELECT *
                            FROM user_list
                            WHERE username=?`,
                            [username.replace('@', '').replace(',', '')]);

                        if (!checkIfUserExists.length) {
                            return `${user['username']}, that user does not exist in my user list logs.`;
                        }

                        const userLines = await utils.query(`
                            SELECT COUNT(username) as value
                            FROM ??
                            WHERE username=?`,
                            [`logs_${channelName.replace('#', '')}`, username.replace('@', '').replace(',', '')]);

                        const occurence = await  utils.query(`
                            SELECT MAX(ID) as value
                            FROM ??`,
                            [`logs_${channelName.replace('#', '')}`]);

                        return `${user['username']}, this user has total of ${userLines[0].value} lines logged
                        in channel ${channelName.replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")},
                        that's ${((userLines[0].value/occurence[0].value)*100).toFixed(2)}%
                        of all lines in that channel.`
                    }
                        const checkIfUserExists = await utils.query(`
                            SELECT *
                            FROM user_list
                            WHERE username=?`,
                            [username.replace('@', '').replace(',', '')]);

                        // check if channel exists in user_list logs
                        if (!checkIfUserExists.length) {
                            return `${user['username']}, that user does not exist in my user list logs.`;
                        }

                        const userLines = await utils.query(`
                            SELECT COUNT(username) as value
                            FROM ??
                            WHERE username=?`,
                            [`logs_${this.channel}`, username.replace('@', '').replace(',', '')]);

                        const occurence = await  utils.query(`
                            SELECT MAX(ID) as value
                            FROM ??`,
                            [`logs_${this.channel}`]);

                        return `${user['username']}, this user has total of ${userLines[0].value} lines logged,
                        that's ${((userLines[0].value/occurence[0].value)*100).toFixed(2)}%
                        of all lines in this channel.`;
                }

                const values = await utils.query(`
                    SELECT COUNT(username) as value
                    FROM ??
                    WHERE username=?`,
                    [`logs_${this.channel}`, user['username']]);

                const occurence = await  utils.query(`
                    SELECT MAX(ID) as value
                    FROM ??`,
                    [`logs_${this.channel}`]);

                return `${user['username']}, you have total of ${values[0].value} lines logged,
                that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}%
                of all lines in this channel.`
            }

            const statsColor = async() => {
                const got = require(`got`);
                if (msg.find(i => i.match(/^(-)?(\bgen\b|\bgenerate\b|\brand\b|\brandom\b)/g))) {
                    const randomColor = Math.floor(Math.random()*16777215).toString(16);

                    return `${user['username']}, random color in hex: #${randomColor}`;
                }

                if (!msg[1]) {
                    if (user['color'] === null) {
                        const usersData = await utils.query(`
                            SELECT COUNT(*) AS users
                            FROM user_list
                            WHERE color="gray"`);

                        return `${user['username']}, you don't have any color set (gray on chatterino),
                        ${usersData[0].users-1} users didn't set their colors either :o`;
                    }

                    const usersData = await utils.query(`
                        SELECT COUNT(*) AS users
                        FROM user_list
                        WHERE color=?`,
                        [user['color']]);

                    const color = await got(`https://www.thecolorapi.com/id?hex=${user['color'].replace('#', '')}`).json();

                   if (Number(usersData[0].users) === 0 || Number(usersData[0].users) === 1) {
                        await utils.query(`
                            UPDATE user_list
                            SET color=?
                            WHERE userId=?`,
                            [user['color'], user['user-id']]);

                        return `${user['username']}, you are the only one with color ${color.name.value} ${user['color']} in my database KomodoHype !`;
                    }

                    return `${user['username']}, you share your color (${color.name.value} ${user['color']}) with ${usersData[0].users-1}
                    other users logged in my database B)`;
                }

                if (msg[1].startsWith('#')) {
                    const color = await got(`https://www.thecolorapi.com/id?hex=${msg[1].replace('#', '')}`).json();
                    if (!color?.rgb ?? true) {
                        return `${user['username']}, this color Hex was not found.`;
                    }
                    if (color.rgb.fraction.r === null) {
                        return `${user['username']}, this color Hex was not found.`;
                    }

                    const checkHexFromMessage = await utils.query(`
                        SELECT *
                        FROM user_list
                        WHERE color=?`,
                        [msg[1]]);

                    if (!checkHexFromMessage.length) {
                        if (color.name.closest_named_hex === "#000000") {
                            return `${user['username']}, this color Hex was not found.`;
                        }
                        return `${user['username']}, there is no users with specified color, closest color found to the specified one: ${color.name.value} (${color.name.closest_named_hex})`;
                    }

                    return `${user['username']}, there are ${checkHexFromMessage.length} users with color ${color.name.value} (${color.name.closest_named_hex})`;
                }

                const checkUserFromMessage = await utils.query(`
                    SELECT *
                    FROM user_list
                    WHERE username=?`,
                    [msg[1].replace('@', '')]);

                if (!checkUserFromMessage.length) {
                    return `${user['username']}, this user does not exist in my database.`;
                }

                const updateColor = await got(`https://api.ivr.fi/twitch/resolve/${msg[1].replace('@', '')}`).json();

                await utils.query(`
                    UPDATE user_list
                    SET color=?
                    WHERE username=?`,
                    [((updateColor.chatColor === null) ? 'gray' : updateColor.chatColor), msg[1].replace('@', '')]);

                const userColor = await utils.query(`
                    SELECT *
                    FROM user_list
                    WHERE username=?`,
                    [msg[1].replace('@', '')]);

                if (userColor[0].color === "gray" || userColor[0].color === null) {
                    const userData = await utils.query(`
                        SELECT COUNT(*) AS users
                        FROM user_list
                        WHERE color="gray"`);

                    return `${user['username']}, this user has not set a color yet (gray on chatterino),
                    ${userData[0].users-1} other users didn't set their colors either :o`;
                }

                const usersData = await utils.query(`
                    SELECT COUNT(*) AS users
                    FROM user_list
                    WHERE color=?`,
                    [userColor[0].color]);

                const color = await got(`https://www.thecolorapi.com/id?hex=${userColor[0].color.replace('#', '')}`).json();

                if (Number(usersData[0].users) === 1 || Number(usersData[0].users) === 0) {
                    return `${user['username']}, that user is the only one with color
                   ${color.name.value} ${userColor[0].color}! KomodoHype`;
                }

                return `${user['username']}, this user's color (${color.name.value} ${userColor[0].color})
                is being used by ${usersData[0].users-1} other users`;
            }

            const checkStatsPrefix = (input) => {
                return msg.filter(i => i.toLowerCase().includes(input))
                    .toString()
                    .includes(input);
            }

            const checkStatsUserPrefix = msg.filter(i => i.startsWith('@')).toString().includes('@');

            const checkIfOptedOut = async () => {
                for (let i = 0; i < msg.length; i++) {
                    const findUser = await utils.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["stats", msg[i].toLowerCase().replace(/@|,/g, '')]);

                    if (findUser.length && (user['username'] != msg[i].toLowerCase().replace(/@|,/g, ''))) {
                        return findUser;
                        continue;
                    }
                }
            }

            switch (true) {
                case checkStatsPrefix('-bruh'):
                    if (platform === "whisper") {
                        return "This usage is disabled on this platform";
                    }
                    if ((await checkIfOptedOut())?.length ?? false) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }
                    return statsBruh(); // kb stats -bruh [@user or #channel]

                case checkStatsPrefix('-lines'):
                    if ((await checkIfOptedOut())?.length ?? false) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }
                    return statsLines(); // kb stats -lines [@user] [#channel]

                case checkStatsPrefix('-channel'):
                    return statsChannel(); // kb stats -channel [#channel]

                case checkStatsPrefix('-color'):
                    if ((await checkIfOptedOut())?.length ?? false) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }
                    return statsColor(); // kb stats -color [@user]

                case checkStatsUserPrefix:
                    if (platform === "whisper") {
                        return "This usage is disabled on this platform";
                    }
                    if ((await checkIfOptedOut())?.length ?? false) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }
                    return statsUser(); // kb stats [@user] [message]

                case msg.length != 0:
                    if (platform === "whisper") {
                        return "This usage is disabled on this platform";
                    }
                    return statsMessage(); // kb stats [message]

                default:
                    if (platform === "whisper") {
                        return "This usage is disabled on this platform";
                    }
                    return stats(); // kb stats
            }
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}