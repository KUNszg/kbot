#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const shell = require('child_process');

module.exports = {
	name: "kb restart",
	invocation: async (channel, user, message, platform) => {
		try {
			const msg = custom.getParam(message);

            if (user['user-id'] === "194267009") {
                if (msg[0] === "bot") {
                    shell.execSync('cd .. && cd bot2465 && sudo git pull');

                    setTimeout(() => {
                        shell.execSync('pm2 restart bot');
                    }, 1000);

                    return `${user['username']}, successfully updated and restarted bot2465 :)`;
                }
            }

            if (user['user-id'] === "97517466") {
                if (msg[0] === "bot") {
                    shell.execSync('cd .. && cd phaypbot && sudo git pull');

                    setTimeout(() => {
                        shell.execSync('pm2 restart pbot');
                    }, 1000);

                    return `${user['username']}, successfully updated and restarted Phaypbot :)`;
                }
            }

			if (await custom.checkPermissions(user['username'])<4) {
				return '';
			}

            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

			const pullFromRepo = shell
				.execSync('sudo git pull')
				.toString()
				.replace(/-{2,}/g, "")
				.replace(/\+{2,}/g, "");

			// rapid restart flag
			if (msg[1] === '-f') {
                if (channel === "#supinic") {
                    kb.say(channel, `downloading data 🛰 ppSlide 💻  👉 ${await pullFromRepo}`);
                } else {
                    kb.say(channel, `downloading data 🛰 ppHop 💻  👉 ${await pullFromRepo}`);
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
				    kb.say(channel, `data transfer initialized 🛰 ppSlide 💻 👉 ${await pullFromRepo}`);
                } else {
                    kb.say(channel, `pulling from @master KomodoHype 👉 ${await pullFromRepo}`);
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
				kb.say(channel, `pulling from @master KomodoHype 👉 ${await pullFromRepo}`);

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
				kb.say(channel, `pulling from @master KomodoHype 👉 ${await pullFromRepo}`);

				// send a message that api is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						kb.say('nymn', 'restarting api KKona 👉 🚪');
					} else {
						kb.say(channel, 'restarting api 👉 🚪');
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
				kb.say(channel, `pulling from @master KomodoHype 👉 ${await pullFromRepo}`);

				// send a message that api is restarting
				setTimeout(() => {
					if (channel === '#nymn') {
						kb.say('nymn', 'restarting all processes KKona 7');
					} else {
						kb.say(channel, 'restarting all processes KKona 7');
					}
				}, 4000);

				// restart all processes via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart all');
				}, 4500);
				return '';
			}

			return 'invalid syntax eShrug';
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}