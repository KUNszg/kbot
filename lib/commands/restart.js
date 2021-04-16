#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const shell = require('child_process');
const kb = require('../handler.js').kb;

module.exports = {
	name: "kb restart",
	invocation: async (channel, user, message) => {
		try {
			const msg = utils.getParam(message.toLowerCase());

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

			if (await utils.checkPermissions(user['username'])<4) {
				return '';
			}

            if (msg[0] === "alias" || msg[0] === "aliases") {
                const fs = require('fs');
                const data = await utils.query('SELECT * FROM commands');
                const list = data.filter(i => i.aliases != null);

                let aliasList = [];

                for (let i = 0; i<list.length; i++) {
                    aliasList.push(list[i].aliases.replace(/\//g, list[i].command).split(";"))
                }

                aliasList = [].concat.apply([], aliasList)

                aliasList = aliasList.map(i => JSON.parse('{"'+i.split('>')[0] + '": "' + i.split('>')[1] + '"}'))

                fs.writeFileSync('./data/aliases.json', JSON.stringify(aliasList));

                return 'done';
            }

            const pullFromRepo = (mod) => {
                const pullFromRepo = shell
                    .execSync('sudo git pull')
                    .toString()
                    .split('\n')

                if (pullFromRepo[0].toLowerCase().includes('already up to date')) {
                    setTimeout(() => {
                        shell.execSync(`pm2 restart ${mod}`);
                    }, 1000);

                    return 'restarting with no updates BroBalt';
                }

                const formattedResponse = pullFromRepo[0].toLowerCase().split('.')[0] +
                    ' | ' + pullFromRepo.splice(2).join('\n').replace(/-{2,}/g, "").replace(/\+{2,}/g, "");

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
				return `KomodoHype 👉 ${pullFromRepo("api")}`;
			}

			// restart all processes
			if (msg[0] === 'all') {
				return `KomodoHype 👉 ${pullFromRepo("all")}`;
			}

            if (msg[0] === 'mysql') {
                shell.execSync("sudo /opt/lampp/xampp reloadmysql");

                return `database reloaded`;
            }

			return 'invalid syntax eShrug';
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}