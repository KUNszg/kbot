#!/usr/bin/env node
'use strict';

const login = require('./credentials/login.js').options;
const custom = require('./utils/functions.js');

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
})

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

    // init the command and get result from it
	let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

	stall.clear();

	if (!result) {
		return;
	}

	let checkUsersPinged = require('./static/chatters.js').chatters;

	checkUsersPinged = checkUsersPinged.filter(i => i[channel.replace('#', '')]);

	if (checkUsersPinged.length === 0) {
		kb.say(channel, `${user['username']}, bot is still loading, please wait :)`);
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
	}

    // cooldown
	if (talkedRecently.has(user['username'] + '_' +
		commands[input[1].toLowerCase()].name.replace('kb ', ''))) {
		return;
	}
	talkedRecently.add(
		user['username'] + '_' + commands[input[1].toLowerCase()].name.replace('kb ', '')
		);
	setTimeout(() => {
		talkedRecently.delete(
			user['username'] + '_' + commands[input[1].toLowerCase()].name.replace('kb ', '')
			);
	}, commands[input[1].toLowerCase()].cooldown);

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
		return '';
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
});

module.exports = { kb }