#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const custom = require('./utils/functions.js');

const repeatedMessages = {
    kunszg: null
};

const tmi = require('tmi.js');
const kb = new tmi.client(login);
kb.connect();

const con = require('./credentials/login.js').con;
con.connect((err) => {
    if (err) {
        kb.whisper('kunszg', 'database connection error');
        console.log(err)
    } else {
        console.log("Database connected!");
    }
});

kb.on('connected', () => {
    kb.whisper('kunszg', 'init reconnected');
});

const racismRegex = new RegExp(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);

// handling Twitch chat messages
kb.on("chat", async (channel, user, message, self) => {
    // ignore messages from kunszgbot
    if (self) { return; }

    const Alias = new custom.Alias(message);
    let input = message.replace(Alias.getRegex(), Alias.getReplacement()).replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(' ');

    if (channel === "#cyr") {
        if (message.split(' ')[0] === "!song") {
            message = "kb spotify @cyr";
            input = message.split(' ');
        }
    }

    if (input[0].toLowerCase() != "kb") { return; }

    const requireDir = require('require-dir');
    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') { return; }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(user["username"], ` this command is already processing another user's request. Please wait :)`);
    }

    // check if user is banned from bot
    const checkBan = await custom.query(`
        SELECT *
        FROM ban_list
        WHERE user_id=?`,
        [user['user-id']]);

    if (checkBan.length) { return; }

    let checkUsersPinged = require('./static/chatters.js').chatters;

    if (checkUsersPinged.length) {
        checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);
    }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

    // log the command execution
    const parseResult = (typeof result === "undefined" || !result) ? '' : result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '');

    await custom.query(`
        INSERT INTO executions (username, command, result, channel, date)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [user['username'], input.join(' '), parseResult, channel.replace('#', '')]);

    stall.clear();

    if (!result) { return; }

    if (checkUsersPinged.length) {
        if (typeof checkUsersPinged[0][channel.replace('#', '')] != "undefined") {
            if (commands[input[1]].name != "kb hug" && commands[input[1]].name != "kb dank") {
                const userList = checkUsersPinged[0][channel.replace('#', '')].filter(i => result.split(' ').includes(i))

                if (userList.length>2) {
                    kb.say(channel, `${user['username']}, too many users pinged by the result of this command, check whispers for response PrideFloat`);
                    kb.whisper(user['username'], result);
                    return;
                }
            }
        }
    }

    if (repeatedMessages[channel] === result) {
        result += " \u{E0000}";
    }
    repeatedMessages[channel] = result;

    // cooldown
    const Cooldown = new custom.Cooldown(user, commands, input, (await custom.checkPermissions(user.username)));

    if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

    // check if channels are live
    const checkChannelStatus = await custom.query(`
        SELECT *
        FROM channels
        WHERE channel=?`,
        [channel.replace('#', '')]);

    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "forsen") { return; }
    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "vadikus007") { return; }

    try {
        const badWord = result.match(racismRegex)
        if (badWord != null) {
            kb.say(channel, `${user['username']}, bad word detected :z`);
            return;
        }

        const test = await custom.banphrasePass(result, channel.replace('#', ''));
        if (test.banned) {
            if (custom.strictChannels(channel) && custom.ignore(channel)) {
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
    if (self) { return; }

    const Alias = new custom.Alias(message);
    const input = message.replace(Alias.getRegex(), Alias.getReplacement()).replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(' ');

    if (input[0].toLowerCase() != "kb") { return; }

    const requireDir = require('require-dir');
    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') { return; }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(username, "this command is already processing another user's request. Please wait :)");
    }

    // check if user is banned from bot
    const checkBan = await custom.query(`
        SELECT *
        FROM ban_list
        WHERE user_id=?`,
        [user['user-id']]);

    if (checkBan.length) { return; }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(username, user, message, "whisper");

    // log the command execution
    const parseResult = (typeof result === "undefined" || !result) ? '' : result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '');

    await custom.query(`
        INSERT INTO executions (username, command, result, channel, date)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [user['username'], input.join(' '), parseResult, '#whisper']);

    stall.clear();

    if (!result) { return; }

    // cooldown
    const Cooldown = new custom.Cooldown(user, commands, input, (await custom.checkPermissions(user.username)));

    if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

    if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
        kb.whisper(username, 'N OMEGALUL');
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
    await custom.query(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"`);
})();

// update command list in database
(async () => {
    const fs = require('fs');
    const files = fs.readdirSync('./lib/commands');

    const results = await custom.query(`SELECT * FROM commands`);

    for (let i = 0; i < results.length; i++) {
        const compareCommands = files.filter(cmd => cmd === `${results[i].command}.js`);
        if (!compareCommands.length) {
            await custom.query(`
                DELETE FROM commands
                WHERE command=?`,
                [results[i].command]);
        }
    }

    for (let i = 0; i < files.length; i++) {
        const compareDatabase = results.filter(j => `${j.command}.js` === files[i]);
        if (!compareDatabase.length) {
            await custom.query(`
                INSERT INTO commands (command, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [files[i].replace('.js', '')]);
        }
    }
})();

setInterval(async () => {
    await custom.query(`
        UPDATE stats
        SET date=?
        WHERE type="module" AND sha="bot"`,
        [new Date().toISOString().slice(0, 19).replace('T', ' ')]);
}, 60000);

// notice messages from twitch
kb.on("notice", async (channel, msgid, message) => {
    if (msgid === "host_target_went_offline") {
        return;
    }

    if (msgid === "msg_banned" || msgid === "msg_channel_suspended") {
        const channels = await custom.query(`
            SELECT *
            FROM channels
            WHERE channel=?`,
            [channel.replace("#", "")]);

        if (channels.length) {
            kb.part(channel.replace("#", ""));
            await custom.query(`
                INSERT INTO parted_channels (channel, userId, message, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [channel.replace("#", ""), channels[0].userId, message]);

            await custom.query(`
                DELETE
                FROM channels
                WHERE userId=?`,
                [channels[0].userId]);

            await custom.query(`
                DELETE
                FROM channels_logger
                WHERE userId=?`,
                [channels[0].userId]);
        }
    }

    await custom.query(`
        INSERT INTO notice (msgid, message, channel, date, module)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, "bot")`,
        [msgid, message, channel.replace('#', '')]);
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

