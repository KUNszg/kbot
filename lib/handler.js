#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const utils = require('./utils/utils.js');
const regex = require('./utils/regex.js');
const requireDir = require('require-dir');

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
    }
});

kb.on('connected', () => {
    kb.whisper('kunszg', 'init reconnected');
});

// handling Twitch chat messages
kb.on("chat", async (channel, user, message, self) => {
    // ignore messages from kunszgbot
    if (self) { return; }

    // find aliases in message
    const Alias = new utils.Alias(message);
    let input = message.replace(Alias.getRegex(), Alias.getReplacement()).replace(regex.invisChar, '').split(' ');

    // custom commands per channel
    if (channel === "#cyr") {
        if (message.split(' ')[0] === "!song") {
            message = "kb spotify @cyr";
            input = message.split(' ');
        }
    }

    // 3rd party commands
    if (message.match(/(^(\?|!)cookie)|(^\+ed)|(^\$ps)/i)) {
        const commands = requireDir('./commands/3rd-party');
        input = input[0].replace(/^(\+|\?|!|\$)/, "");

        if (typeof commands[input] === 'undefined') { return; }

        let result = await commands[input].invocation(channel, user, message);

        if (!result) { return; }

        const test = await utils.banphrasePass(user['username'], channel.replace('#', ''));
        if (test.banned) {
            if (utils.strictChannels(channel) && utils.ignore(channel)) {
                kb.say(channel, "response contains a banphrased username");
                kb.whisper(user['username'], result);
                commands.length = 0;
                return;
            }
        }

        commands.length = 0;

        kb.say(channel, result);
        return;
    }

    if (input[0].toLowerCase() != "kb") { return; }

    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') { return; }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(user["username"], ` this command is already processing another user's request. Please wait :)`);
    }

    // check if user is banned from bot
    if ((await utils.Get.user().banned(user)).length) { return; }

    let checkUsersPinged = require('./misc/chatters.js').chatters;

    if (checkUsersPinged.length) {
        checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);
    }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

    // url replace result.replace(/(http:\/\/|https:\/\/)?(www.)?/, '').replace('.', '(dot)');

    // log the command execution
    utils.Log.exec(user, input, result, channel);

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
    const Cooldown = new utils.Cooldown(user, commands, input, (await utils.checkPermissions(user.username)));
    if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

    // check if channels marked as strict are live
    if ((await utils.Get.channel().isStrictAndLive(channel))) { return; }

    try {
        const badWord = result.match(regex.racism);
        if (badWord != null) {
            kb.say(channel, `${user['username']}, bad word detected :z`);
            return;
        }

        const test = await utils.banphrasePass(result, channel.replace('#', ''));
        if (test.banned) {
            if (utils.strictChannels(channel) && utils.ignore(channel)) {
                if (await utils.banphrasePass(user['username'], channel.replace('#', ''))) {
                    kb.say(channel, "response contains a banphrased username");
                    kb.whisper(user['username'], result);
                    return;
                }
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

    const Alias = new utils.Alias(message);
    const input = message.replace(Alias.getRegex(), Alias.getReplacement()).replace(regex.invisChar, '').split(' ');

    if (input[0].toLowerCase() != "kb") { return; }

    const commands = requireDir('./commands');
    if (typeof commands[input[1]] === 'undefined') { return; }

    // check if command is still processing
    const stall = require('./commands/stats').stall;
    if (stall.has('busy') && commands[input[1]].name === "kb stats") {
        kb.whisper(username, "this command is already processing another user's request. Please wait :)");
    }

    // check if user is banned from bot
    if ((await utils.Get.user().banned(user)).length) { return; }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(username, user, message, "whisper");

    // log the command execution
    utils.Log.exec(user, input, result, username);

    stall.clear();

    if (!result) { return; }

    // cooldown
    const Cooldown = new utils.Cooldown(user, commands, input, (await utils.checkPermissions(user.username)));

    if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

    if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
        kb.whisper(username, 'N OMEGALUL');
        return;
    }

    const badWord = result.match(regex.racism);
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
    await utils.query(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"`);
})();

// update command list in database
(async () => {
    const fs = require('fs');
    const files = fs.readdirSync('./lib/commands');

    const results = await utils.query(`SELECT * FROM commands`);

    for (let i = 0; i < results.length; i++) {
        const compareCommands = files.filter(cmd => cmd === `${results[i].command}.js`);
        if (!compareCommands.length) {
            await utils.query(`
                DELETE FROM commands
                WHERE command=?`,
                [results[i].command]);
        }
    }

    for (let i = 0; i < files.length; i++) {
        const compareDatabase = results.filter(j => `${j.command}.js` === files[i]);
        if (!compareDatabase.length) {
            await utils.query(`
                INSERT INTO commands (command, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [files[i].replace('.js', '')]);
        }
    }
})();

setInterval(async () => {
    await utils.query(`
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
        const channels = await utils.query(`
            SELECT *
            FROM channels
            WHERE channel=?`,
            [channel.replace("#", "")]);

        if (channels.length) {
            kb.part(channel.replace("#", ""));
            await utils.query(`
                INSERT INTO parted_channels (channel, userId, message, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [channel.replace("#", ""), channels[0].userId, message]);

            await utils.query(`
                DELETE
                FROM channels
                WHERE userId=?`,
                [channels[0].userId]);

            await utils.query(`
                DELETE
                FROM channels_logger
                WHERE userId=?`,
                [channels[0].userId]);
        }
    }

    await utils.query(`
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

