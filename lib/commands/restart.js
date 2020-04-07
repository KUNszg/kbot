#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const shell = require('child_process');

module.exports = {
	name: prefix + "restart",
	aliases: null,
	description: `restart [logger] | logger - restarts the logger | 
	no parameter - restarts the bot -- cooldown 10ms`,
	permission: 4,
	cooldown: 10,
	invocation: async (channel, user, message, args) => {
		try {

			if (await custom.checkPermissions(user['username'])<4) { 
				return '';
			}
			
			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			const pullFromRepo = shell
				.execSync('sudo git pull')
				.toString()
				.replace(/-{2,}/g, "")
				.replace(/\+{2,}/g, "");
			
			// rapid restart flag
			if (msg[1] === '-f') {

				bot.kb.say(channel, `restarting with -f flag and pulling from @master 
					PogChamp 👉 ${await pullFromRepo}`);

				setTimeout(() => {
					shell.execSync(`pm2 restart ${msg[0]}`);
				}, 1000);

				return '';
			}

			// restart bot.js
			if (!msg[0]) {

				// pull from repo
				bot.kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

				// send a message that bot is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						return 'restarting LUL 👉 🚪';
					} 
					return 'restarting KKona 👉 🚪';	
				}, 4000);

				// restart via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart bot');
				}, 4200);
				return '';
			}
			
			// restart logger.js
			if (msg[0] === 'logger') {

				// pull from repo
				bot.kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

				// send a message that logger is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						return 'restarting LUL 👉 🚪';
					} 
					return 'restarting KKona 👉 🚪';	
				}, 4000);

				// restart via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart logger');
				}, 4200);
				return '';
			} 
			
			// restart api.js
			if (msg[0] === 'api') {

				// pull from repo
				bot.kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

				// send a message that api is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						bot.kb.say('nymn', 'restarting api KKona 👉 🚪');
					} else {
						bot.kb.say(channel, 'restarting api 👉 🚪');
					}
				}, 4000);

				// restart via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart api');
				}, 4500);
				return '';
			}

			// restart all processes
			if (msg[0] === 'all') {

				// pull from repo
				bot.kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

				// send a message that api is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						bot.kb.say('nymn', 'restarting all processes KKona 7');
					} else {
						bot.kb.say(channel, 'restarting all processes KKona 7');
					}
				}, 4000);

				// restart all processes via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart all');
				}, 4200);
				return '';
			} 

			return 'imagine forgetting your own syntax OMEGALUL';

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}