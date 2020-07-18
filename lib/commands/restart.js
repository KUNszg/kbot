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

			const msg = custom.getParam(message);

			const pullFromRepo = shell
				.execSync('sudo git pull')
				.toString()
				.replace(/-{2,}/g, "")
				.replace(/\+{2,}/g, "");

			// rapid restart flag
			if (msg[1] === '-f') {

                if (channel === "#supinic") {
                    bot.kb.say(channel, `downloading data 🛰 ppSlide 💻  👉 ${await pullFromRepo}`);
                } else {
                    bot.kb.say(channel, `downloading data 🛰 ppHop 💻  👉 ${await pullFromRepo}`);
                }

				setTimeout(() => {
					shell.execSync(`pm2 restart ${msg[0]}`);
				}, 1000);

				return '';
			}

			// restart bot.js
			if (!msg[0]) {

				// pull from repo
                if (channel === "#supinic") {
				    bot.kb.say(channel, `data transfer initialized 🛰 ppSlide 💻 👉 ${await pullFromRepo}`);
                } else {
                    bot.kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);
                }

				// send a message that bot is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						return 'restarting LUL 👉 🚪';
					}
					return 'restarting KKona 👉 🚪';
				}, 4000);

				// restart via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart init');
				}, 4500);
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
				}, 4500);
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
				}, 4500);
				return '';
			}

			return 'imagine forgetting your own syntax OMEGALUL';

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}