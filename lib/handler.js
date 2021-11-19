#!/usr/bin/env node
'use strict';

const utils = require('./utils/utils.js');
const regex = require('./utils/regex.js');
const config = require('./credentials/config.js');
const init = require('./utils/connection.js');
const requireDir = require('require-dir');
const Discord = require('discord.js');

const kb = new init.IRC();
const discord = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

kb.tmiConnect();
kb.sqlConnect();
discord.login(config.discord);

const talkedRecently = new Set();

(async () => {
    const channels = await utils.query("SELECT * FROM channels");

    let _channels = [];

    channels.map(i => _channels.push(i));

    setInterval(() => {
        _channels.length = 0;
        channels.map(i => _channels.push(i));
    }, 330000); // 5min 30s

    async function handler(channel, user, message, self, event, messageState) {
        // ignore messages from the bot
        if (self) { return; }

        // find aliases in message
        const Alias = new utils.Alias(message);
        let input = message.replace(Alias.getRegex(), Alias.getReplacement()).replace(regex.invisChar, '').split(' ');

        if (event === "discord") {
            if (input[0].toLowerCase() != "kb") { return; }

            const commands = requireDir('./commands');
            if (typeof commands[input[1]] === 'undefined') { return; }

            // cooldown
            const Cooldown = new utils.Cooldown(user, commands, input, (await utils.checkPermissions(user.username)), "discord");
            if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

            // check if command is still processing
            const stall = require('./commands/stats').stall;
            if (stall.has('busy') && commands[input[1]].name === "kb stats") { return; }

            // check if user is banned from bot
            if ((await utils.Get.user().banned(user)).length) { return; }

            // init the command and get result from it
            let result = await commands[input[1].toLowerCase()].invocation(channel, user, message, event);

            // log the command execution
            utils.Log.exec(user, input, result, channel);

            new utils.WSocket("wsl").emit({type: "commandExecs", data: 1});

            stall.clear();

            if (!result) { return; }

            // remove additional spaces, newlines etc. in response for discord message formatting
            result = result.split(" ").filter(i => i != false).join(" ").replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/gu, "");;

            // remove usernames from response since messageState.reply() is being used to mention users
            if (result.split(" ")[0].replace(",", "") === messageState.author.username.toLowerCase()) {
                result = result.split(" ").splice(1, result.split(" ").length).join(" ")
            }

            commands.length = 0;

            const badWord = result.match(regex.racism);
            if (badWord != null) {
                messageState.reply(`${user.username}, bad word detected :z`);
                return;
            }
            messageState.reply(result);
            return;
        }

        // 3rd party commands
        if (message.match(/(^(\?|!)cookie)|(^\+ed)|(^\$ps)/i) && event === "chat") {
            const commands = requireDir('./commands/3rd-party');
            input = input[0].replace(/^(\+|\?|!|\$)/, "");

            if (typeof commands[input] === 'undefined') { return; }

            let result = await commands[input].invocation(channel, user, message);

            if (!result) { return; }

            if (!utils.ignore(channel)) {
                kb.say(channel, result);
                return;
            }

            try {
                if ((await utils.banphrasePass(user.username, channel.replace('#', ''))).banned) {
                    kb.say(channel, `username in result is banphrased, I whispered the message tho cmonBruh`);
                    kb.whisper(user.username, result);
                    return;
                }

                if ((await utils.banphrasePass(result, channel.replace('#', ''))).banned) {
                    kb.say(channel, `${user.username}, the result is banphrased, I whispered it to you tho cmonBruh`);
                    kb.whisper(user.username, result);
                    return;
                }
            } catch (err) {
                if (err.message.toLowerCase().includes('getaddrinfo')) {
                    kb.say(channel, `${user.username}, failed to check for banphrases, I whispered you the response :)`);
                    kb.whisper(user.username, result);
                }
            }

            commands.length = 0;

            kb.say(channel, result);
            return;
        }

        if (input[0].toLowerCase() != "kb") { return; }

        const commands = requireDir('./commands');
        if (typeof commands[input[1]] === 'undefined') { return; }

        if (event === "chat" && utils.strictChannels(channel, true)) {
            if ((await utils.checkPermissions(user.username)) < 1) {
                if (talkedRecently.has(channel)) { return; }

                talkedRecently.add(channel);

                let timeout = 1200;
                if (_channels.filter(i => i.channel === channel.replace("#", "") && i.status === "live").length) {
                    timeout = 12000;
                }

                setTimeout(() => {
                    talkedRecently.delete(channel);
                }, timeout);
            }
        }

        // cooldown
        const Cooldown = new utils.Cooldown(user, commands, input, (await utils.checkPermissions(user.username)), "twitch");
        if ((await Cooldown.setCooldown()).length || (await Cooldown.setGlobalCooldown()).length) { return; }

        // check if command is still processing
        const stall = require('./commands/stats').stall;
        if (stall.has('busy') && commands[input[1]].name === "kb stats") {
            kb.whisper(user.username, ` this command is already processing another user's request. Please wait :)`);
        }

        // check if user is banned from bot
        if ((await utils.Get.user().banned(user)).length) { return; }

        // init the command and get result from it
        let result = await commands[input[1].toLowerCase()].invocation(channel, user, message, event);

        // log the command execution
        utils.Log.exec(user, input, result, channel);

        new utils.WSocket("wsl").emit({type: "commandExecs", data: 1});

        stall.clear();

        if (!result) { return; }

        // replace link in strict channels
        let link = result.match(regex.url)
        if (channel === "#forsen" && link != null) {
            for (let i = 0; i<link.length; i++) {
                const _link = link[i].replace(/(https:\/\/)?(www.)?/g, "").replace(".", "(dot)");
                result = result.replace(link[i], _link)
            }
        }

        if (event === "chat") {
            // check if channels marked as strict are live
            if ((await utils.Get.channel().isStrictAndLive(channel))) { return; }

            // check for pinged users
            let checkUsersPinged = require('./misc/chatters.js').chatters;

            if (checkUsersPinged.length) {
                checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);
            }

            if (checkUsersPinged.length) {
                if (typeof checkUsersPinged[0][channel.replace('#', '')] != "undefined") {
                    if (commands[input[1]].name != "kb hug" && commands[input[1]].name != "kb dank") {
                        const userList = checkUsersPinged[0][channel.replace('#', '')].filter(i => result.split(' ').includes(i))

                        if (userList.length>2) {
                            kb.say(channel, `${user.username}, too many users pinged by the result of
                                this command, check whispers for response PrideFloat`);
                            kb.whisper(user.username, result);
                            return;
                        }
                    }
                }
            }

            commands.length = 0;

            if (result.match(regex.racism) != null) {
                kb.say(channel, `${user.username}, bad word detected :z`);
                return;
            }

            if (!utils.ignore(channel)) {
                kb.say(channel, result);
                return
            }

            try {
                if ((await utils.banphrasePass(user.username, channel.replace('#', ''))).banned) {
                    kb.say(channel, `username in result is banphrased, I whispered the message tho cmonBruh`);
                    kb.whisper(user.username, result);
                    return;
                }

                if ((await utils.banphrasePass(result, channel.replace('#', ''))).banned) {
                    kb.say(channel, `${user.username}, the result is banphrased, I whispered it to you tho cmonBruh`);
                    kb.whisper(user.username, result);
                    return;
                }
            }
            catch (err) {
                if (err.message.toLowerCase().includes('getaddrinfo')) {
                    kb.say(channel, `${user.username}, failed to check for banphrases, I whispered you the response :)`);
                    kb.whisper(user.username, result);
                }
            }
            kb.say(channel, result);
            return
        }
        kb.whisper(user.username, result);
    }

    /*
    *   Twitch messages
    */

    kb.on('connected', async () => {
        const owner = await utils.Get.user().owner();

        kb.whisper(owner[0].username, 'init reconnected');
    });

    // handling Twitch action messages
    kb.on("action", async (channel, user, message, self) => {
        await handler(channel, user, message, self, "chat");
    });

    // handling Twitch chat messages
    kb.on("message", async (channel, user, message, self) => {
        await handler(channel, user, message, self, "chat");
    });

    // handling Twitch whispers
    kb.on("whisper", async (username, user, message, self) => {
        await handler(username, user, message, self, "whisper");
    });

    /*
    *   Discord messages
    */

    discord.on('message', message => {
        const user = {
            "username": message.author.username,
            "user-id": message.author.id,
            "color": null
        };
        const channel = message.channel.guild.name;
        const msg = message.content;
        const self = discord.user.id === message.author.id;

        handler(channel, user, msg, self, "discord", message);
    });
})();

kb.on("timeout", (channel, username, message, duration, msg) => {
    if (channel === "#supinic") {
        if (duration == '1') {
            kb.say(channel, `${username} vanished Article13 MagicTime`)
        } else if (msg.isPermaban()){
            kb.say(channe, `${username} has been permanently banned MODS Clap`);
        } else {
            kb.say(channel, `${username} has been timed out for ${duration}s Article13 MagicTime`)
        }
    }
});

kb.on("clearchat", (channel) => {
    if (channel === "#kunszg") {
        kb.say('kunszg', 'MODS clean the chat');
        return;
    }
});

// notice messages from twitch
kb.on("notice", async (channel, msgid, message) => {
    if (msgid === "host_target_went_offline") {
        return;
    }

    if (msgid === "msg_banned") {
        if (message != "This channel does not exist or has been suspended.") {
            const channels = await kb.query(`
                SELECT *
                FROM channels
                WHERE channel=?`,
                [channel.replace("#", "")]);

            if (channels.length) {
                kb.part(channel.replace("#", ""));
                await kb.query(`
                    INSERT INTO parted_channels (channel, userId, message, date)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                    [channel.replace("#", ""), channels[0].userId, message]);

                await kb.query(`
                    DELETE
                    FROM channels
                    WHERE userId=?`,
                    [channels[0].userId]);

                await kb.query(`
                    DELETE
                    FROM channels_logger
                    WHERE userId=?`,
                    [channels[0].userId]);
            }
        }
    }

    await kb.query(`
        INSERT INTO notice (msgid, message, channel, date, module)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, "bot")`,
        [msgid, message, channel.replace('#', '')]);
    return;
});

(async () => {
    // update bot startup timestamp
    await kb.query(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"`, []);

    setInterval(async () => {
        await kb.query(`
            UPDATE stats
            SET date=?
            WHERE type="module" AND sha="bot"`,
            [new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }, 60000);

    // update command list in database
    const fs = require('fs');

    let files = fs.readdirSync('./lib/commands');

    files = files.filter(item => item !== "3rd-party")

    const results = await kb.query(`SELECT * FROM commands`);

    for (let i = 0; i < results.length; i++) {
        const compareCommands = files.filter(cmd => cmd === `${results[i].command}.js`);
        if (!compareCommands.length) {
            await kb.query(`
                INSERT INTO commands_deleted (command, aliases, cooldown, permissions, date, description_formatted, description, optoutable, usage)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [results[i].command, results[i].aliases, results[i].cooldown, results[i].permissions,
                results[i].date, results[i].description_formatted, results[i].description,
                results[i].optoutable, results[i].usage]);

            await kb.query(`
                DELETE FROM commands
                WHERE command=?`,
                [results[i].command]);
        }
    }

    for (let i = 0; i < files.length; i++) {
        const compareDatabase = results.filter(j => `${j.command}.js` === files[i]);
        if (!compareDatabase.length) {
            await kb.query(`
                INSERT INTO commands (command, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [files[i].replace('.js', '')]);
        }
    }

    setInterval(() => {
        fs.writeFileSync("./data/temp_api_uptime.txt", process.uptime().toString());

        new utils.WSocket("wsl").emit(
            { type: "botUptime", data: process.uptime().toFixed(2) }
        );
    }, 1000);

    new utils.WSocket("wsl").emit(
        { type: "botRestarting", data: Number(Date.now()) }
    );
    fs.writeFileSync("./data/temp_api_restarting.txt", Date.now().toString());
})();

module.exports = { kb }

