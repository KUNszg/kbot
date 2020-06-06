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
con.connect(function(err) {
	if (err) {
		kb.say('supinic', '@kunszg database connection error Pepega');
	} else {
		console.log("Database connected!");
	}
});

const talkedRecently = new Set();
const globalCooldown = new Set();

kb.on('connected', (adress, port) => {
	kb.say('kunszg', 'reconnected KKona');
})

kb.on("chat", async (channel, user, message, self) => {

	// todo: handle aliases (probably with separate file)
	const input = message
		.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
		.replace(/\b4head\b/i, '4head')
		.replace(/\bchn\b/i, 'channels')
		.replace(/\blocation\b/i, 'locate')
		.replace(/\byomama\b/i, 'joemama')
		.replace(/\bgit\b/i, 'github')
		.replace(/\bgg\b/i, 'google')
		.replace(/\bdailysurah\b/i, 'surah')
		.replace(/\bdaily\b/i, 'surah')
		.replace(/\bkiss\b/i, 'hug')
		.replace(/\bbp\b/i, 'banphrase')
		.replace(/\bct\b/i, 'chat')
        .replace(/\bsyn\b/i, 'synonym')
        .replace(/\bsyno\b/i, 'synonym')
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

    const stall = require('./commands/stats').stall;
    kb.say('kunszg', String(stall.length))
    if (stall.has('busy')) {
        kb.whisper(user["username"], ` this command is already processing another user's request. Please wait :)`);
    }

	// check if user is on cooldown
	let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

	if (!result) {
		return;
	}
	if (user['username'] === "kunszg") {
		const test = await custom.banphrasePass(result, channel.replace('#', ''));
		if (test.banned === true && (channel === '#nymn' || channel === "#forsen")) {
			kb.say(channel, `${user['username']}, banphrased cmonBruh`);
			kb.whisper(user['username'], result)
			return;
		}
		const stall = require('./commands/stats').stall;
        kb.say(channel, result);
        stall.clear();
		return;
	}
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

	const checkChannelStatus = await custom.doQuery(`
		SELECT *
		FROM channels
		WHERE channel="${channel.replace('#', '')}"
		`)
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

	const checkBan = await custom.doQuery(`
		SELECT *
		FROM ban_list
		WHERE user_id="${user['user-id']}"
		`);

	if (checkBan.length != 0) {
		return;
	}

	async function sendResponse() {
		if (!result) {
			return;
		}
		if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
			kb.say(channel, user['username'] + ', TriHard oauth key');
			return;
		}
		if (result
			.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === "undefined") {
				kb.say(channel, 'Internal error monkaS')
				return;
		}
		const test = await custom.banphrasePass(result, channel.replace('#', ''));
		if (channel === '#nymn' || channel === '#forsen') {
			if (test.banned === true) {
				kb.say(channel, user['username'] +
					', the result is banphrased, I whispered it to you tho cmonBruh')
				kb.whisper(user['username'], result);
				return;
			}
			if (result.toLowerCase() === 'object') {
				if (channel === '#nymn') {
					kb.say(channel, ' object peepoSquad')
					return;
				}
			}
			kb.say(channel, result);
            stall.clear();
		} else {
			if (result.toLowerCase() === 'object') {
				kb.say(channel, ' object 🦍')
				return;
			}
            kb.say(channel, result);
            stall.clear();
		}
	}
	sendResponse()
	commands.length = 0;
});

module.exports = {kb}