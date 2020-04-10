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
	const input = message
		.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
		.replace('chn', 'channels')
		.replace('ct', 'chat')
		.replace('location', 'locate')
		.replace('yomama', 'joemama')
		.replace('git', 'github')
		.replace('dailysurah', 'surah')
		.replace('daily', 'surah')
		.replace('kiss', 'hug')
		.replace('bp', 'banphrase')
		.split(' ')

	if (self) return;

	const requireDir = require('require-dir');
	const commands = requireDir('./commands');

	if (!input[0].toLowerCase().replace(/,/, '').replace('@', '').startsWith("kb")) {
		return;
	}

	// todo: handle aliases (probably with separate file)
	if (typeof commands[input[1]] === "undefined") {
		return;				
	}  

	let result = await commands[input[1].toLowerCase()].invocation(channel, user, message);

	const checkChannelStatus = await custom.doQuery(`
		SELECT * 
		FROM channels 
		WHERE channel="${channel.replace('#', '')}"
		`)

	if (checkChannelStatus[0].status === "live" && 
		(checkChannelStatus[0].channel === "nymn" || checkChannelStatus[0].channel === "pajlada")) {
		return;
	}

	if (!result) {
		return;
	}
	if (repeatedMessages[channel] === result) {
		result += " \u{E0000}";
	}
	repeatedMessages[channel] = result;

	if (user['username'] === "kunszg") {
		const test = await custom.banphrasePass(result);
		if (test.banned === true) {
			kb.say(channel, `${user['username']}, banphrased cmonBruh`);
			kb.whisper(user['username'], result)
			return;
		}
		kb.say(channel, result);
		return;
	}			

	// check for global cooldown
	if (globalCooldown.has(user['username'] && user['username'])) {
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

	// check if user is on cooldown
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
		const test = await custom.banphrasePass(result);
		if (channel === '#nymn') {
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
		} else {
			if (result.toLowerCase() === 'object') {
				kb.say(channel, ' object 🦍')
				return;
			}
			kb.say(channel, result);
		}
	}
	sendResponse()	
});

module.exports = {kb}