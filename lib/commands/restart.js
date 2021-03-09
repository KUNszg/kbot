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

            const pullFromRepo = (mod) => {
                    const pullFromRepo = shell
                        .execSync('sudo git pull')
                        .toString()
                        .split('\n')

                    if (pullFromRepo[0].toLowerCase().includes('already up to date')) {
                        return `bot is already up to date FeelsDankMan`;
                    }

                    const formattedResponse = pullFromRepo[0].toLowerCase().split('.')[0] +
                        ' | ' + pullFromRepo.splice(3).join('\n').replace(/-{2,}/g, "").replace(/\+{2,}/g, "");

                    setTimeout(() => {
                        shell.execSync(`pm2 restart ${mod}`);
                    }, 1000);

                    return formattedResponse;
            }

			if (msg[1] === '-f') {
                if (channel === "#supinic") {
                    return `downloading data 🛰 ppSlide 💻  👉 ${pullFromRepo(msg[0])}`;
                }
                return `downloading data 🛰 ppHop 💻  👉 ${pullFromRepo(msg[0])}`;
			}

			// restart bot.js
			if (!msg[0]) {
                if (channel === "#supinic") {
				    return `data transfer initialized 🛰 ppSlide 💻 👉 ${pullFromRepo("init")}`;
                }
                return `KomodoHype 👉 ${pullFromRepo("init")}`;
			}

			// restart logger.js
			if (msg[0] === 'logger') {
				return `KomodoHype 👉 ${pullFromRepo("logger")}`
			}

			// restart api.js
			if (msg[0] === 'api') {
				// pull from repo
				kb.say(channel, `KomodoHype 👉 ${await pullFromRepo}`);

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
				kb.say(channel, `KomodoHype 👉 ${await pullFromRepo}`);

				// restart all processes via pm2
				setTimeout(() => {
					shell.execSync('pm2 restart all && sudo /opt/lampp/xampp reloadmysql');
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