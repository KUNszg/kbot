#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const custom = require('./utils/functions.js');
const aliasList = require('../data/aliases.json');
const mysql = require('mysql2');

const repeatedMessages = {
    kunszg: null
};

const tmi = require('tmi.js');
const kb = new tmi.client(login);
kb.connect();

const con = require('./credentials/login.js').con;
con.connect((err) => {
    if (err) {
        kb.say('kunszg', '@kunszg database connection error Pepega');
        console.log(err)
    } else {
        console.log("Database connected!");
    }
});

kb.on('connected', () => {
    kb.whisper('kunszg', 'init reconnected');
});

const talkedRecently = new Set();

const racismRegex = new RegExp(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);

// handling Twitch chat messages
kb.on("chat", async (channel, user, message, self) => {
    // ignore messages from kunszgbot
    if (self) {
        return;
    }

    // handle aliases
    const convertToRegexp = (input) => {
        return new RegExp(`\\b${input}\\b`, "i")
    }

    const param = message.toLowerCase().split(' ')[1]

    let alias = aliasList.data.filter(i => i[param]);

    let [getRegex, getReplacement] = ['', ''];

    if (alias.length) {
        getRegex = convertToRegexp(Object.keys(alias[0]));
        getReplacement = Object.values(alias[0])[0];
    }

    const input = message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .replace(getRegex, getReplacement)
        .split(' ')

    // ignore potential mistakes like @kb, !kb, -kb, in bot prefix
    if (input[0].toLowerCase()/*.replace(/((^(@|-|!|\$))|,$)/g, '')*/ != "kb") {
        return;
    }

    const requireDir = require('require-dir');
    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') {
        return;
    }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(user["username"], ` this command is already processing another user's request. Please wait :)`);
    }

    // check if user is banned from bot
    const checkBan = await custom.doQuery(`
        SELECT *
        FROM ban_list
        WHERE user_id="${user['user-id']}"
        `);

    if (checkBan.length != 0) {
        return;
    }

    let checkUsersPinged = require('./static/chatters.js').chatters;

    if (checkUsersPinged.length != 0) {
        checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);
    }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

    // log the command execution
    const parseResult = (typeof result === "undefined" || !result) ?
        '' : result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '');

    const sqlExecutions = "INSERT INTO executions (username, command, result, channel, date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    const insertExecutions  = [user['username'], input.join(' '), parseResult, channel.replace('#', '')];
    await custom.doQuery(mysql.format(sqlExecutions, insertExecutions));

    stall.clear();

    if (!result) {
        return;
    }

    if (checkUsersPinged.length != 0) {
        const userList = checkUsersPinged[0][channel.replace('#', '')].filter(i => result.split(' ').includes(i))

        if (userList.length>2) {
            kb.say(channel, `${user['username']}, too many users pinged by the result of this command, check whispers for response PrideFloat`);
            kb.whisper(user['username'], result);
            return;
        }
    }

    // bypass for admin
    if (user['user-id'] === "178087241") {
        // match the racism regex
        const badWord = result.match(racismRegex);

        // log the case of bad word in result
        if (badWord != null) {
            kb.say(channel, `${user['username']}, bad word detected :/`);
            return;
        }

        try {
            const test = await custom.banphrasePass(result, channel.replace('#', ''));
            if (test.banned) {
                if (custom.strictChannels(channel)) {
                    kb.say(channel, `${user['username']}, the result is banphrased, I whispered it to you tho cmonBruh`);
                    kb.whisper(user['username'], result);
                    commands.length = 0;
                    return;
                }
            }
            kb.say(channel, result);
            return;
        } catch (err) {
            if (err.message.includes('getaddrinfo')) {
                kb.say(channel, 'Failed to check for banphrases, I whispered you the response');
                kb.whisper(user['username'], result);
            }
        }
    }

    // cooldown
    const cooldownCode = `${user['username']}_${commands[input[1].toLowerCase()].name.replace('kb ', '')}`;
    const permissions = await custom.checkPermissions(user['username']);
    const cooldown = await custom.doQuery(`
        SELECT cooldown
        FROM commands
        WHERE command="${input[1].toLowerCase()}"
        `);

    if (talkedRecently.has(cooldownCode)) {
        return;
    }

    talkedRecently.add(cooldownCode);

    setTimeout(() => {
        talkedRecently.delete(cooldownCode);
    }, (permissions > 0) ? Number(cooldown[0].cooldown)/2 : Number(cooldown[0].cooldown));

    // check if channels are live
    const checkChannelStatus = await custom.doQuery(`
        SELECT *
        FROM channels
        WHERE channel="${channel.replace('#', '')}"
        `);

    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "forsen") {
        return;
    }

    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "vadikus007") {
        return;
    }

    if (repeatedMessages[channel] === result) {
        result += " \u{E0000}";
    }
    repeatedMessages[channel] = result;

    if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
        kb.say(channel, `${user['username']}, N OMEGALUL`);
        return;
    }

    if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === "undefined") {
            kb.say(channel, 'Internal error monkaS')
            return;
    }

    try {
        const badWord = result.match(racismRegex)
        if (badWord != null) {
            kb.say(channel, `${user['username']}, bad word detected :z`);
            return;
        }

        const test = await custom.banphrasePass(result, channel.replace('#', ''));
        if (test.banned) {
            if (custom.strictChannels(channel)) {
                kb.say(channel, `${user['username']}, the result is banphrased, I whispered it to you tho cmonBruh`);
                kb.whisper(user['username'], result);
                commands.length = 0;
                return;
            }
        }

        kb.say(channel, result);

        commands.length = 0;
    } catch (err) {
        if (err.message.includes('getaddrinfo')) {
            kb.say(channel, `${user['username']}, failed to check for banphrases, I whispered you the response :)`);
            kb.whisper(user['username'], result);
        }
    }
});

// handling Twitch whispers
kb.on("whisper", async (username, user, message, self) => {
    // ignore messages from bot itself
    if (self) {
        return;
    }

    // handle aliases
    const convertToRegexp = (input) => {
        return new RegExp(`\\b${input}\\b`, "i")
    }

    const param = message.toLowerCase().split(' ')[1]

    let alias = aliasList.data.filter(i => i[param]);

    let [getRegex, getReplacement] = ['', ''];

    if (alias.length) {
        getRegex = convertToRegexp(Object.keys(alias[0]));
        getReplacement = Object.values(alias[0])[0];
    }

    const input = message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .replace(getRegex, getReplacement)
        .split(' ')

    // ignore potential mistakes like @kb, !kb, -kb, in bot prefix
    if (input[0].toLowerCase()/*.replace(/((^(@|-|!|\$))|,$)/g, '')*/ != "kb") {
        return;
    }

    const requireDir = require('require-dir');
    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') {
        return;
    }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(username, "this command is already processing another user's request. Please wait :)");
    }

    // check if user is banned from bot
    const checkBan = await custom.doQuery(`
        SELECT *
        FROM ban_list
        WHERE user_id="${user['user-id']}"
        `);

    if (checkBan.length != 0) {
        return;
    }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(username, user, message, "whisper");

    // log the command execution
    const parseResult = (typeof result === "undefined" || !result) ?
        '' : result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '');

    const sqlExecutions = "INSERT INTO executions (username, command, result, channel, date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    const insertExecutions  = [user['username'], input.join(' '), parseResult, '#whisper'];
    await custom.doQuery(mysql.format(sqlExecutions, insertExecutions));

    stall.clear();

    if (!result) {
        return;
    }

    // bypass for admin
    if (user['user-id'] === "178087241") {
        // match the racism regex
        const badWord = result.match(racismRegex);

        // log the case of bad word in result
        if (badWord != null) {
            kb.whisper(username, 'bad word detected :/');
            return;
        }
        result = result.split(' ')[0].replace(',', '') === user['username'] ?
        result.split(' ').splice(1).join(' ') : result

        kb.whisper(username, result);
        return;
    }

    // cooldown
    const cooldownCode = `${username}_${commands[input[1].toLowerCase()].name.replace('kb ', '')}`;
    const permissions = await custom.checkPermissions(username);
    const cooldown = await custom.doQuery(`
        SELECT cooldown
        FROM commands
        WHERE command="${input[1].toLowerCase()}"
        `);

    if (talkedRecently.has(cooldownCode)) {
        return;
    }

    talkedRecently.add(cooldownCode);

    setTimeout(() => {
        talkedRecently.delete(cooldownCode);
    }, (permissions > 0) ? Number(cooldown[0].cooldown)/2 : Number(cooldown[0].cooldown));

    if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
        kb.whisper(username, 'N OMEGALUL');
        return;
    }

    if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === "undefined") {
            kb.whisper(username, 'Internal error monkaS')
            return;
    }

    const badWord = result.match(racismRegex);
    if (badWord != null) {
        kb.whisper(username, 'bad word detected :z');
        return;
    }

    result = result.split(' ')[0].replace(',', '') === user['username'] ?
    result.split(' ').splice(1).join(' ') : result

    kb.whisper(username, result);

    commands.length = 0;
});


// update timestamp when bot has restarted
(async () => {
    await custom.doQuery(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"
        `);
})();

// update command list in database
(async () => {
    const fs = require('fs');
    const files = fs.readdirSync('./lib/commands');

    const results = await custom.doQuery(`
        SELECT *
        FROM commands
        `);

    for (let i=0; i<results.length; i++) {
        const compareCommands = files.filter(cmd => cmd === `${results[i].command}.js`);
        if (!compareCommands.length) {
            await custom.doQuery(`
                DELETE FROM commands
                WHERE command="${results[i].command}"
                `);
        }
    }

    for (let i=0; i<files.length; i++) {
        const compareDatabase = results.filter(j => `${j.command}.js` === files[i]);
        if (!compareDatabase.length) {
            await custom.doQuery(`
                INSERT INTO commands (command, date)
                VALUES ("${files[i].replace('.js', '')}", CURRENT_TIMESTAMP)
                `);
        }
    }
})();

// update alive check
const aliveCheck = async () => {
    await custom.doQuery(`
        UPDATE stats
        SET date="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
        WHERE type="module" AND sha="bot"
    `);
}
aliveCheck();
setInterval(() => {
    aliveCheck();
}, 60000);

// notice messages from twitch
kb.on("notice", async (channel, msgid, message) => {
    await custom.doQuery(`
        INSERT INTO notice (msgid, message, channel, date)
        VALUES ("${msgid}", "${message}", "${channel.replace('#', '')}", CURRENT_TIMESTAMP)
        `);
    return;
});

// handling discord
/*
const Discord = require('discord.js');
const discord = new Discord.Client();

discord.on('message', msg => {
    return;
});

const creds = require('./credentials/config.js')
discord.login(creds);
*/
module.exports = { kb }

