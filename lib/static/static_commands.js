#!/usr/bin/env node
'use strict';

// first connection to database to receive channel list 
// this should be moved into another module and reworked
const creds = require('../credentials/config.js');
const mysql = require('mysql2');
const con = mysql.createConnection({
	host: creds.db_host,
	user: creds.db_server_user,
	password: creds.db_pass,
	database: creds.db_name
});
const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(results);
        }      
    });
});
const channelList = [];
const channelOptions = []
async function res() {
	channelList.push(await getChannels());
	await channelList[0].forEach(i => channelOptions.push(i.channel))
}
res()

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleep(1500)

const options = {
	options: {
		debug: false,
	},
	connection: {
		cluster: 'aws',
	},
	identity: {
		username: 'kunszgbot',
		password: creds.oauth,
	},
	channels: channelOptions,
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const repeatedMessages = {
	supinic: null
};
const dankPrefix = '?';
const talkedRecently = new Set();
const talkedRecently2 = new Set();
const dankeval = [
	{
		name: 'HONEYDETECTED',
		aliases: null,
		invocation: async (channel, user, message, args) => {
			if (user['user-id'] != '68136884') {
				return '';
			}
			return 'HONEYDETECTED POŁĄCZONO PONOWNIE KKurwa 7';
		}
	},

	{
		name: dankPrefix + 'cookie',
		aliases: '!cookie',
		invocation: async (channel, user, args) => {
			try {
				
				if (talkedRecently.has(user['user-id'])) {
					return '';
				} else {
					talkedRecently.add(user['user-id']);
					setTimeout(() => {
						talkedRecently.delete(user['user-id']);
					}, 3000);
				}

				const getAlias = await custom.doQuery(`
					SELECT *
					FROM user_list
					WHERE userId=${user['user-id']}
					`);
				if (getAlias.length === 0) {
					return '';
				}
				
				const cookieModule = await custom.doQuery(`SELECT reminders FROM cookieModule WHERE type="cookie"`);
				if (cookieModule[0].reminders === "false") {
					return '';
				}
				const query = await custom.doQuery(`
					SELECT * 
					FROM cookie_reminders
					WHERE user_alias="${getAlias[0].ID}"
					`);

				const userChannel = `#${user['username']}`;
				const channelNoPing = channel.replace(/^(.{2})/, "$1\u{E0000}");
				if (query.length === 0) {
					return '';
				}

				const cookieApi = await fetch(`https://api.roaringiron.com/cooldown/${user['user-id']}?id=true`)
					.then(response => response.json());
				
				Date.prototype.addMinutes = function(minutes) {
					const copiedDate = new Date(this.getTime());
					return new Date(copiedDate.getTime() + minutes * 1000);
				}

				if (!cookieApi || typeof cookieApi.seconds_left === "undefined") {
					return ''
				}

				if (cookieApi.seconds_left < cookieApi.interval_unformatted-10 || cookieApi.seconds_left === 0) {
					if (cookieApi.time_left_formatted === 0) {
						return '';
					}
					
					kb.whisper(user['username'], `Your cookie is still on cooldown 
						(${cookieApi.time_left_formatted}) with ${cookieApi.interval_formatted} intervals.`);
					return '';
				} else {
			
					await custom.doQuery(`UPDATE cookie_reminders SET cookie_count="${query[0].cookie_count + 1}" WHERE user_alias="${getAlias[0].ID}"`);
					const now = new Date();
					const timestamp = now.addMinutes(cookieApi.interval_unformatted).toISOString().slice(0, 19).replace('T', ' ');
					await custom.doQuery(`UPDATE cookie_reminders SET channel="${channel.replace('#', '')}", fires="${timestamp}", status="scheduled" WHERE user_alias="${getAlias[0].ID}"`);

					if (query[0].initplatform === "channel") {
						if (query[0].status === "scheduled") {
							kb.say(userChannel, `${user['username']}, updating your pending cookie reminder, 
								I will remind you in ${cookieApi.interval_formatted} 
								(channel ${channelNoPing}) :D`);
						} else {
							kb.say(userChannel,	`${user['username']}, I will remind you to eat the cookie in 
								${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`);
						}
					} else if (query[0].initplatform === "whisper") {
						if (query[0].status === "scheduled") {
							kb.whisper(user['username'], `updating your pending cookie reminder, 
								I will remind you in ${cookieApi.interval_formatted} 
								(channel ${channelNoPing}) :D`);
						} else {
							kb.whisper(user['username'], `I will remind you to eat the 
								cookie in ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`);
						}
					} else if (query[0].initplatform === "silence") {
					 	return '';
					}
				}
				return '';
			} catch (err) {
				custom.errorLog(err);
				return	`${user['username']}, the cookie API is down, hold your horses until it goes back online monkaS / 🐴 `;
			}
		}
	},
	
	{
		name: "+ed",
		aliases: "+enterdungeon",
		invocation: async (channel, user, message, args) => {
			try{

				function format(seconds) {
					function pad(s) {
						return (s < 10 ? '0' : '') + s;
					}
					var hours = Math.floor(seconds / (60 * 60));
					var minutes = Math.floor(seconds % (60 * 60) / 60);
					var seconds = Math.floor(seconds % 60);
					if (hours === 0 && minutes != 0) {
						return minutes + 'm ' + seconds + "s";
					} else {
						if (minutes === 0 && hours === 0) {
							return seconds + "s"
						} else if (seconds === 5 || hours === 0 && minutes === 0) {
							return '0s'
						} else {
							return hours + 'h ' + minutes + 'm ' + seconds + "s";
						}
					}
				}
				function sleep(milliseconds) {
					const start = new Date().getTime();
					for (var i = 0; i < 1e7; i++) {
						if ((new Date().getTime() - start) > milliseconds) {
							break;
						}
					}
				}
				sleep(1500);
				if (talkedRecently2.has(user['user-id'])) { 
					return '';
				} else {
					talkedRecently2.add(user['user-id']);
					setTimeout(() => {
						talkedRecently2.delete(user['user-id']);
					}, 2000);
				}
				
				const cookieModule = await custom.doQuery(`
					SELECT reminders 
					FROM cookieModule 
					WHERE type="ed"
					`);
				
				if (cookieModule[0].reminders === "false") {
					return '';
				}
				
				const getUserAlias = await custom.doQuery(`
					SELECT * 
					FROM user_list
					WHERE userId="${user['user-id']}"
					`);
				if (getUserAlias.length === 0) {
					return `${user['username']}, you are not being tracked in my database, you should type something in my channel in order to get your first log.`;
				}

				const getUserData = await custom.doQuery(`
					SELECT * 
					FROM ed_reminders
					WHERE user_alias="${getUserAlias[0].ID}"
					`)
			
				if (getUserData.length === 0) {
					return '';
			    }
		
				Date.prototype.addMinutes = function(minutes) {
					var copiedDate = new Date(this.getTime());
					return new Date(copiedDate.getTime() + minutes * 1000);
				}

				const getEdData = await fetch(`https://huwobot.me/api/user?id=${user['user-id']}`)
					.then(response => response.json());
				if (typeof getEdData.next_entry === "undefined") {
					return `${user['username']}, you are not registered for huwobot's reminders Pepega`;
				}

				const now = new Date();
				const timeDiff = getEdData.next_entry - getEdData.last_entry;
		
				if (getUserData[0].initPlatform === "silence") {
					await custom.doQuery(`
					UPDATE ed_reminders 
					SET channel="${channel.replace('#', '')}", 
						fires="${now.addMinutes(timeDiff.toFixed(0)).toISOString().slice(0, 19).replace('T', ' ')}", 
						status="scheduled",
						count=${getUserData[0].count + 1}
					WHERE username="${user['username']}"
					`);
					return '';
				}
				// check if ed is still pending, add 1h to timezone offset to match huwobot's timezone
				if (getEdData.next_entry.toFixed(0) > (Date.now(new Date())/1000) && 
					(getEdData.next_entry.toFixed(0) - (Date.now(new Date())/1000))<3580) {

						kb.whisper(user['username'], `Your dungeon entry is still on cooldown 
							(${format(getEdData.next_entry.toFixed(0) - (Date.now(new Date())/1000))})  
							to force-set your reminder use "kb ed force".`)
						return '';
				}

				kb.whisper(user['username'], 'I will remind you to enter the dungeon in 1h :)');

				await custom.doQuery(`
					UPDATE ed_reminders 
					SET channel="${channel.replace('#', '')}", 
						fires="${now.addMinutes(timeDiff.toFixed(0)).toISOString().slice(0, 19).replace('T', ' ')}", 
						status="scheduled",
						count=${getUserData[0].count + 1}
					WHERE username="${user['username']}"
					`);
				return '';
			} catch (err) {
				kb.say(channel, '@kunszg, monkaS ' + err)
				custom.errorLog(err);
			}
		}
	},

	{
		name: dankPrefix + "deval",
		aliases: null,
		invocation: async (channel, user, message, args) => {
			try {
				if (user['user-id'] != "178087241") {
					return ''.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '');
				} else {
					function reverse(s) {
						return s.split('').reverse().join('');
					}

					function hasNumber(myString) {
						return /\d/.test(myString);
					}

					function sleep(milliseconds) {
						const start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}
					const msg = message.split(" ").splice(1);
					const ev = await eval('(async () => {' +
						msg.join(" ").replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') + 
						'})()');
					console.log(ev);
					return String(ev);
				}
			} catch (err) {
				custom.errorLog(err)
				return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	},
];

kb.on("chat", async (channel, user, message, self) => {
	if (self) return;
	dankeval.forEach(async smart => {
		if ((message.split(' ')[0] === smart.name) ||
			(smart.aliases && message.split(' ')[0] === smart.aliases)) {
			let result = await smart.invocation(channel, user, message);

			const checkChannelStatus = await custom.doQuery(`
				SELECT * 
				FROM channels 
				WHERE channel="${channel.replace('#', '')}"
				`)

			if (checkChannelStatus[0].status === "live" && (checkChannelStatus[0].channel === "nymn" || 
				checkChannelStatus[0].channel === "pajlada") ) {
				return;
			}

			if (!result) {
				kb.say(channel, '');
			}
			if (result === "undefined") {
				kb.say(channel, user['username'] + ", FeelsDankMan something fucked up")
				return;
			} else {
				if (result === '') {
					kb.say(channel, '')
					return;
				} else if (repeatedMessages[channel] === result) {
					result += " \u{E0000}";
				}
			}
			repeatedMessages[channel] = result;
			if (result === "undefined") {
				return;
			}
			kb.say(channel, result.toString());
		}
	});
});

kb.on('chat', async function(channel, user, message) {
	if (message.startsWith('`')) {
		
		if (await custom.checkPermissions(user['username'])<3) { 
			return '';
		}

		const msgChannel = message
			.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
			.replace('`', '')
			.split(' ')[0];

		const msg = message
			.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
			.split(' ')
			.splice(1)
			.join(' ')
			
		if (!msg) {
			kb.say(channel, `${user['username']}, no message provided.`);
		}
		kb.say(msgChannel, msg)
	}
	return;
})

kb.on('chat', function(channel, user, message) {
	if (channel === '#haxk' && message === "!xd") {
		kb.say('haxk', "⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛⠛⠛⠛⠛⠛⠿⠿⣿⣿⣿⣿⣿" + 
					  " ⣿⣿⣯⡉⠉⠉⠙⢿⣿⠟⠉⠉⠉⣩⡇⠄⠄⢀⣀⣀⡀⠄⠄⠈⠹⣿⣿⣿" + 
					  " ⣿⣿⣿⣷⣄⠄⠄⠈⠁⠄⠄⣠⣾⣿⡇⠄⠄⢸⣿⣿⣿⣷⡀⠄⠄⠘⣿⣿" +
					  " ⣿⣿⣿⣿⣿⣶⠄⠄⠄⠠⣾⣿⣿⣿⡇⠄⠄⢸⣿⣿⣿⣿⡇⠄⠄⠄⣿⣿" +
					  " ⣿⣿⣿⣿⠟⠁⠄⠄⠄⠄⠙⢿⣿⣿⡇⠄⠄⠸⠿⠿⠿⠟⠄⠄⠄⣰⣿⣿" +
					  " ⣿⡿⠟⠁⠄⢀⣰⣶⣄⠄⠄⠈⠻⣿⡇⠄⠄⠄⠄⠄⠄⠄⢀⣠⣾⣿⣿⣿" +
					  " ⣿⣷⣶⣶⣶⣿⣿⣿⣿⣷⣶⣶⣶⣿⣷⣶⣶⣶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣿ "
					  );
	} else if (channel==="#supinic"&&message === "$ps sneeze") {
		if (talkedRecently.has(user['user-id'])) {
			return;
		} else {
			talkedRecently.add(user['user-id']);
			setTimeout(() => {
				talkedRecently.delete(user['user-id']);
			}, 5000);
		}
		function sleep(milliseconds) {
			const start = new Date().getTime();
			for (var i = 0; i < 1e7; i++) {
				if ((new Date().getTime() - start) > milliseconds) {
					break;
				}
			}
		}
		sleep(1000);
		kb.say('supinic', ' bless u monkaC')
		return;
	} else {
		return; 
	}
});

kb.on("timeout", function(channel, username, message, duration) {
	if (channel != "#supinic") {
		return;
	} else {
		if (duration == '1') {
			kb.say(channel, username + " vanished Article13 MagicTime")
		} else {
			kb.say(channel, username + " has been timed out for " + duration + "s Article13 MagicTime")
		}
	}
});

kb.on("ban", function(channel, username) {
	if (channel != "#supinic") return;
	else
		kb.say("Supinic", username + " has been permamently banned pepeMeltdown")
});

kb.on("hosted", function(channel, username, viewers) {
	if (channel != "#supinic") return;
	else
		kb.say("Supinic", username + " hosted supinic with " + viewers + " viewers HACKERMANS ")
});