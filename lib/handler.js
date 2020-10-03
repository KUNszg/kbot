#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const custom = require('./utils/functions.js');
 const aliasList = require('../data/aliases.json');
const mysql = require('mysql2');

const repeatedMessages = {
    supinic: null
};

const tmi = require('tmi.js');
const kb = new tmi.client(login);
kb.connect();

const con = require('./credentials/login.js').con;
con.connect((err) => {
    if (err) {
        kb.say('supinic', '@kunszg database connection error Pepega');
    } else {
        console.log("Database connected!");
    }
});

kb.on('connected', () => {
    kb.whisper('kunszg', 'init reconnected');
});

// update timestamp when bot has restarted
(async () => {
    await custom.doQuery(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"
        `)
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

const talkedRecently = new Set();
const globalCooldown = new Set();
kb.on("chat", async (channel, user, message, self) => {
    // ignore messages from kunszgbot
    if (self) {
        return;
    }

    const convertToRegexp = (input) => {
        return new RegExp(`\\b${input}\\b`, "i")
    }

    const param = message.toLowerCase().split(' ')[1]

    let alias = aliasList.data.filter(i => i[param]);

    let [getRegex, getReplacement] = ['', ''];

    if ((Object.keys(alias[0])?.[0] ?? false) && (Object.values(alias[0])?.[0] ?? false)) {
        getRegex = convertToRegexp(Object.keys(alias));
        getReplacement = Object.values(alias)[0];
    }

    const input = message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .replace(getRegex, getReplacement)
        .split(' ')

    // ignore potential mistakes like @kb, !kb, -kb, in bot prefix
    if (input[0].toLowerCase().replace(/((^(@|-|!|\$))|,$)/g, '') != "kb") {
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

    const racismRegex = new RegExp(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);

    // bypass for admin
    if (user['user-id'] === "178087241") {
        const badWord = result.match(racismRegex);

        if (badWord != null) {
            await custom.doQuery(`
                INSERT INTO error_logs (error_message, date)
                VALUES ("${result}", CURRENT_TIMESTAMP)
                `);
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

    // check for global cooldown
    if (globalCooldown.has(user['username'])) {
        return;
    }
    globalCooldown.add(user['username']);
    setTimeout(() => {
        globalCooldown.delete(user['username']);
    }, 3000);

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
            await custom.doQuery(`
                INSERt INTO suggestions (username, message, created, status, note)
                VALUES ("${user['username']}", "[INPUT] => ${message}, [RESULT] => ${result}, [PHRASE] => ${badWord[0]}", CURRENT_TIMESTAMP, "new", "racism regex")
                `);
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

module.exports = { kb }