#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const custom = require('./utils/functions.js');
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
(async() => {
    await custom.doQuery(`
        UPDATE stats
        SET date=CURRENT_TIMESTAMP
        WHERE type="uptime"
        `)
})();

const talkedRecently = new Set();
const globalCooldown = new Set();
kb.on("chat", async (channel, user, message, self) => {
    // todo: handle aliases (probably with separate file)
    const input = message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .replace(/\b4head\b/i, '4head')
        .replace(/\bjoke\b/i, '4head')
        .replace(/\bchn\b/i, 'channels')
        .replace(/\blocation\b/i, 'locate')
        .replace(/\byomama\b/i, 'joemama')
        .replace(/\bmom\b/i, 'joemama')
        .replace(/\bgit\b/i, 'github')
        .replace(/\bgg\b/i, 'google')
        .replace(/\bdailysurah\b/i, 'surah')
        .replace(/\bdaily\b/i, 'surah')
        .replace(/\bkiss\b/i, 'hug')
        .replace(/\bbp\b/i, 'banphrase')
        .replace(/\bct\b/i, 'chat')
        .replace(/\bsyn\b/i, 'synonym')
        .replace(/\bsyno\b/i, 'synonym')
        .replace(/\bpeng\b/i, 'ping')
        .replace(/\bpong\b/i, 'ping')
        .replace(/\bpang\b/i, 'ping')
        .replace(/\bpung\b/i, 'ping')
        .replace(/\bpyng\b/i, 'pyng')
        .replace(/\bjoin\b/i, 'party join')
        .replace(/\bleave\b/i, 'party leave')
        .replace(/\bcreate\b/i, 'party create')
        .replace(/\bready\b/i, 'party ready')
        .replace(/\bleave\b/i, 'party leave')
        .replace(/\bditch\b/i, 'party leave')
        .replace(/\blist\b/i, 'party list')
        .replace(/\bunready\b/i, 'party unready')
        .replace(/\bdisband\b/i, 'party disband')
        .replace(/\bcolor\b/i, 'stats -color')
        // .replace(/\bdistance\b/i, 'locate -dist')
        .split(' ')

    if (self) {
        return;
    }

    if (!input[0].toLowerCase().replace(/,/, '').replace('@', '').replace('!', '').replace('-', '').startsWith("kb")) {
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

    // check if user is banned
    const checkBan = await custom.doQuery(`
        SELECT *
        FROM ban_list
        WHERE user_id="${user['user-id']}"
        `);

    if (checkBan.length != 0) {
        return;
    }

    let checkUsersPinged = require('./static/chatters.js').chatters;

    checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);

    if (!checkUsersPinged.length) {
        const getChannelId = await custom.doQuery(`
            SELECT *
            FROM channels
            WHERE channel="${channel.replace('#', '')}"
            `);

        const getUptime = await custom.doQuery(`
            SELECT *
            FROM stats
            WHERE type="uptime"
            `);

        const diff = ((Date.now() - Date.parse(getUptime[0].date))/1000); // get time difference between when bot was launched and current time in seconds

        // chatters module loads data for each channel every 3 seconds so I multiply channel ID by 3 and substract it from time difference since bot launch
        kb.say(channel, `${user['username']}, bot is still loading ⌛ ${Math.abs(diff - getChannelId[0].ID * 3).toFixed(0)} more seconds for this channel, please wait :)`);
        return;
    }

    // init the command and get result from it
    let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

    // log the command execution
    const sqlExecutions = "INSERT INTO executions (username, command, result, channel, date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    const insertExecutions  = [user['username'], input.join(' '), result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, ''), channel.replace('#', '')]
    await custom.doQuery(mysql.format(sqlExecutions, insertExecutions));

    stall.clear();

    if (!result) {
        return;
    }

    const userList = checkUsersPinged[0][channel.replace('#', '')].filter(i => result.split(' ').includes(i))

    if (userList.length>6) {
        kb.say(channel, `${user['username']}, too many users pinged by the result of this command, check whispers for response PrideFloat`);
        kb.whisper(user['username'], result);
        return;
    }

    // bypass for admin
    if (user['username'] === "kunszg") {
        const badWord = result.match(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);

        if (badWord) {
            await custom.doQuery(`
                INSERT INTO error_logs (error_message, date)
                VALUES ("${result}", CURRENT_TIMESTAMP)
                `);
            kb.say(channel, `${user['username']}, bad word detected, check error logs :)`);
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
        	const stall = require('./commands/stats').stall;
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
    const cooldown = commands[input[1].toLowerCase()].cooldown;
    if (talkedRecently.has(cooldownCode)) {
        return;
    }

    talkedRecently.add(cooldownCode);

    setTimeout(() => {
        talkedRecently.delete(cooldownCode);
    }, (permissions > 0) ? cooldown/2 : cooldown);

    // check if channels are live
    const checkChannelStatus = await custom.doQuery(`
        SELECT *
        FROM channels
        WHERE channel="${channel.replace('#', '')}"
        `);

    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "nymn") {
        return;
    }

    if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel === "forsen") {
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
        const badWord = result.match(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/)

        if (badWord) {
            await custom.doQuery(`
                INSERt INTO suggestions (username, message, created, status, note)
                VALUES ("${user['username']}", "[ ORIGINAL MESSAGE ] => ${message} [ RESULT ] => ${result}", CURRENT_TIMESTAMP, "new", "racism regex")
                `);
            kb.say(channel, `${user['username']}, bad word detected, this result and usage has been logged for further review :z`);
            return;
        }

	    const test = await custom.banphrasePass(result, channel.replace('#', ''));
	    if (test.banned) {
	        if (custom.strictChannels(channel)) {
	            kb.say(
	                channel, `${user['username']}, the result is banphrased, I whispered it to you tho cmonBruh`
	                );
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