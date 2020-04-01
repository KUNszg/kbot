#!/usr/bin/env node

'use strict';

const api = require('./config.js');
const mysql = require('mysql2');

const con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: api.db_pass,
	database: "kbot"
});

const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results, fields) => {
        if (err) {
        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
			const insert = [JSON.stringify(err), new Date()];
			con.query(mysql.format(sql, insert),
				function(error, results, fields) {
					if (error) {
						console.log(error)
						reject(error)
					} else {
						resolve(results)
					}
				})
            reject(err);
        }
        else {
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

function sleepGlob(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleepGlob(1500)

const options = {
	options: {
		debug: false,
	},
	connection: {
		cluster: 'aws',
	},
	identity: {
		username: 'kunszgbot',
		password: api.oauth,
	},
	channels: channelOptions,
};
const tmi = require('tmi.js');
const kb = new tmi.client(options);
const repeatedMessages = {
	supinic: null
};

kb.connect();
con.connect(function(err) {
	if (err) {
		kb.say('supinic', '@kunszg database connection error Pepega')
	} else {
		console.log("Database connected!");
	}
});

kb.on('connected', (adress, port) => {

	kb.say('kunszg', 'reconnected KKona')
	const randomApod = require('random-apod'); //apod command - for random astro pic of the day
	const search = require("youtube-search"); // rt and yt commands - random video using random words api
	const si = require('systeminformation'); //ping command - ram usage
	const os = require('os'); //uptime command - system uptime
	const rndSong = require('rnd-song'); //rt command - random track using youtube search api
	const rf = require('random-facts'); //rf command - random fact
	const count = require('mathjs');
	const rUni = require('random-unicodes');
	const SpacexApiWrapper = require("spacex-api-wrapper");
	const fetch = require("node-fetch");

	const doQuery = (query) => new Promise((resolve, reject) => {
	    con.query(query, (err, results, fields) => {
	        if (err) {
	        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
				const insert = [JSON.stringify(err), new Date()];
				con.query(mysql.format(sql, insert),
					function(error, results, fields) {
						if (error) {
							console.log(error)
							reject(error)
						} else {
							resolve(results)
						}
					})
	            reject(err);
	        } else {
	            resolve(results);
	        }      
	    });
	});

	async function checkPermissions(username) {
		const checkPermissionList = await doQuery(`
			SELECT *
			FROM trusted_users
			WHERE username="${username}"
			`);
		if (checkPermissionList.length === 0 || checkPermissionList[0].status === "inactive") {
			return 0;
		}
		return checkPermissionList[0].permissions.split(':')[0];
	}

	async function errorLog(err) {
		console.log(err)
		const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
		const insert = [JSON.stringify(err), new Date()];
		await doQuery(mysql.format(sql, insert));
	}

	const banphrasePass = (output) => new Promise((resolve, reject) => {
		const banphrasePass = (fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
			method: "POST",
			url: "https://nymn.pajbot.com/api/v1/banphrases/test",
			body: "message=" + output,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
		}).then(response => response.json()))
		resolve(banphrasePass);
	});

	const prefix = "kb ";
	const commandsExecuted = [];
	const talkedRecently = new Set();
	const globalCooldown = new Set();

	const commands = [

		{
			name: prefix + "uptime",
			aliases: null,
			description: `displays informations about current runtime of the bot, lines, 
			memory usage, host uptime and commands used in the current session -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {

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
								return 'few seconds'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					
					const getOtherModules = await doQuery(`
						SELECT * FROM memory
						`)
					const used = (
						Number(getOtherModules[0].memory) + 
						Number(getOtherModules[1].memory) + 
						Number(getOtherModules[2].memory) + 
						Number((process.memoryUsage().heapUsed/1024/1024).toFixed(2))
						).toFixed(2);

					const uptime = process.uptime();
					const os = require('os');
					const serverUptimeHours = os.uptime()/3600;
					const serverUptimeDays = os.uptime()/86400;

					// get line count of all relevant bot files 
					const linecount = require('linecount')
					async function getLineCount(file) {
						const lines = await new Promise((resolve, reject) => { 	
							linecount(file, (err, count) => {
								if (err) {
									reject(err);
								} else {
									resolve(count);
								}
							});
						});
						return lines;
					} 
					const lines = await getLineCount('./bot.js') + await getLineCount('./reminders.js') + 
					await getLineCount('./logger.js') + await getLineCount('./api.js');

					// if server is live for more than 72 hours and code uptime is less than 42h 
					if (serverUptimeHours > 72 && uptime < 172800) {
						return `${user['username']}, code is running for ${format(uptime)}, has ${lines} lines, 
						memory usage: ${used} MB, host is up for ${serverUptimeDays.toFixed(2)} days, 
						commands used in this session ${commandsExecuted.length} FeelsDankMan`;
					}
					
					// if code uptime is more than 42h and server is live for more than 72h
					if (uptime > 172800 && serverUptimeHours > 72) {
						return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, 
						has ${lines} lines, memory usage: ${used} MB, host is up for 
						${serverUptimeHours.toFixed(1)}h (${serverUptimeDays.toFixed(2)} days), 
						commands used in this session ${commandsExecuted.length} FeelsDankMan`;
					} 
					
					// if code uptime is more than 42h and server is live for less than 72h
					if (uptime > 172800 && serverUptimeHours < 72) {
						return `${user['username']}, code is running for ${(uptime/86400).toFixed(1)} days, 
						has ${lines} lines, memory usage: ${used} MB, host is up for 
						${serverUptimeHours.toFixed(1)}h, commands used in this session 
						${commandsExecuted.length} FeelsDankMan`;
					} 
					
					// default response
					return `${user['username']}, code is running for ${format(uptime)}, has ${lines} lines, 
					memory usage: ${used} MB, host is up for ${serverUptimeHours.toFixed(1)}h 
					(${serverUptimeDays.toFixed(2)} days), commands used in this session 
					${commandsExecuted.length} FeelsDankMan`;

				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "ping",
			aliases: null,
			description: `syntax: kb ping [service] | no parameter - data about latest github activity |
			service - checks if server/domain is alive -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args, err) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);

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

					if (!msg[0]) {	
						const apiCommits = "https://api.github.com/repos/KUNszg/kbot/commits?per_page=100";
						const urls = [
							apiCommits, 
							apiCommits + '&page=2', 
							apiCommits + '&page=3', 
							apiCommits + '&page=4', 
							apiCommits + '&page=5', 
							apiCommits + '&page=6',
							apiCommits + '&page=7'
							];

						async function getAllUrls(urls) {
						    try {
						        var data = await Promise.all(
						            urls.map(url =>
										fetch(url).then((response) => response.json()))
						            );
						        return data
						    } catch (error) {
						        console.log(error)
						        throw (error)
						    }
						}

						const commitsCount = await getAllUrls(urls);
						const countCommits = (
							(commitsCount.length * 100) - (100 - commitsCount[commitsCount.length-1].length)
							);
						const commitDate = new Date(commitsCount[0][0].commit.committer.date);
						const serverDate = new Date();
						const diff = Math.abs(commitDate - serverDate)
						const latestCommit = (diff / 1000).toFixed(2);
						const ping = await kb.ping();

						if (latestCommit > 259200) {
							return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 my website 
							(under development) https://kunszg.xyz/ latest commit: ${(latestCommit / 86400).toFixed(0)} 
							ago (master, ${commitsCount[0][0].sha.slice(0, 7)}, commit ${countCommits})`;
						} 
						return `${user['username']}, pong FeelsDankMan 🏓 ppHop 🏓💻 check out my website 
						(under development) https://kunszg.xyz/ latest commit: ${format(latestCommit)} ago 
						(master, ${commitsCount[0][0].sha.slice(0, 7)}, commit ${countCommits})`;	
					}
					
					const ping = require('ping');
					const hosts = [msg[0]];
					hosts.forEach(function(host) {
						ping.sys.probe(host, function(isAlive) {
							const mesg = isAlive ? 'host ' + host + ' is alive FeelsGoodMan' : 'host ' + host +
								' is dead FeelsBadMan';
							kb.say(channel, `${user['username']}, ${mesg}`);
						});
					});			
					return '';
		
				} catch (err) {
					errorLog(err)
					if (err.message.includes("undefined")) {
						return `${user['username']}, N OMEGALUL`;
					}
					return 	`${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "spacex",
			aliases: null,
			description: `data from SpaceX about next launch rocket launch date, 
			mission and launch site -- cooldown 15s`,
			permission: 0,
			cooldown: 15000,
			invocation: async (channel, user, message, args) => {
				try {

					const space = await SpacexApiWrapper.getNextLaunch();
					const date = await space.launch_date_utc;
					const apiDate = new Date(date);
					const serverDate = new Date();
					const diff = Math.abs(serverDate - apiDate)
					const DifftoSeconds = (diff / 1000).toFixed(0);
					const toHours = (DifftoSeconds / 3600).toFixed(0);

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
							} else if (seconds === 0 || hours === 0 && minutes === 0) {
								return 'few seconds'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}

					if (toHours > 72) {
						return `Next rocket launch by SpaceX in ${(toHours / 24).toFixed(0)} days, 
						rocket ${space.rocket.rocket_name}, mission ${space.mission_name}, 
						${space.launch_site.site_name_long}, reddit campaign: ${space.links.reddit_campaign}`;
					}
					return `Next rocket launch by SpaceX in ${format(DifftoSeconds)}, rocket 
					${space.rocket.rocket_name}, mission ${space.mission_name}, 
					${space.launch_site.site_name_long}, reddit campaign: ${space.links.reddit_campaign}`;
					
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "rt",
			aliases: null,
			description: `syntax: kb rt [ID] | no parameter - returns a link to the list of genres |
			ID - search for the song in the specified genre (numeric ID) -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(" ")
						.splice(2);

					const options = {
						api_key: api.randomTrack,
						genre: msg[0], //21, 1134, 1147
						snippet: false,
						language: 'en'
					};

					const songData = await new Promise((resolve, reject) => {
						rndSong(options, (err, res) => {
							if (err) {
								reject(err);
							} else {
								resolve(res);
							}
						});
					});

					const random = await search(songData.track.track_name + " by " + songData.track.artist_name, {
						maxResults: 1,
						key: api.youtube
					});

					if (msg.join(" ") === "") {
						return `${user['username']}, list of genres (type in the genre identifier like eg.: 
						kbot rt 15) https://pastebin.com/p5XvHkzn`;
					}

					if (channel != '#supinic') {
						return `${user['username']}, ${songData.track.track_name} by ${songData.track.artist_name}, 
						${random.results[0].link}`;
					} 

					if (channel === '#supinic') {
						return `$sr ${random.results[0].link}`;
					}

				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan ❗";
				}
			}
		},

		{
			name: prefix + "rf",
			aliases: null,
			description: `random fact. Provides facts about random stuff -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const json = await fetch(api.randomFact)
						.then(response => response.json());

					return `${user['username']}, ${json.text.toLowerCase()} 🤔`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "channels",
			aliases: prefix + "chn",
			description: `amount of channels the bot is currently in. | 
			Permitted users syntax: kb chn [join-save/part-session/join-session] [channel] -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const length = kb.getChannels().length;

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(" ")
						.splice(2)
						.filter(Boolean);

					// response for non-admin users
					if (user['user-id'] != "178087241") {
						return `I'm active in ${length} channels, list of channels: https://kunszg.xyz/ 4Head`;
					}

					// parameters for admins
					// check for wrong parameters
					if (msg[0] && !msg[1]) {
						return `${user['username']}, invalid parameter or no channel provided`;
					} 

					// join the channel only for current session, channel will be dismissed after process restarts
					if (msg[0] === "join-session") {
						kb.join(msg[1]);
						return `successfully joined channel 
						${msg[1].toLowerCase().replace(/^(.{2})/, "$1\u{E0000}")} :) 👍`;
					} 

					// join the channel "permanently" by appending it to a file which is being imported after process restarts
					if (msg[0] === "join-save") {
						
						// check if bot is already joined in a channel 
						const checkRepeatedInsert = await doQuery(`
							SELECT * 
							FROM channels 
							WHERE channel="${msg[1]}"
							`)

						if (checkRepeatedInsert.length != 0) {
							return `${user['username']}, I'm already in this channel.`
						}

						// add the channel to the table
						await doQuery(`
							INSERT INTO channels (channel, added) 
							VALUES ("${msg[1].toLowerCase()}", CURRENT_TIMESTAMP)
							`);

						kb.join(msg[1].toLowerCase());
						return `successfully joined #${msg[1].toLowerCase().replace(/^(.{2})/, "$1\u{E0000}")} :) 👍`;
					} 

					// leave the channel for this session, if channel is saved in the file it will be rejoined after session restarts
					if (msg[0] === "part-session") {
						kb.part(msg[1]);
						return `parted the channel ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} for this session`;
					} 

					if (msg[0] === "part-save") {

						// check if bot is already joined in a channel 
						const checkRepeatedInsert = await doQuery(`
							SELECT * 
							FROM channels 
							WHERE channel="${msg[1]}"
							`)

						if (checkRepeatedInsert.length === 0) {
							return `${user['username']}, I'm not joined in that channel.`
						}

						// delete the row with provided channel
						await doQuery(`
							DELETE FROM channels 
							WHERE channel="${msg[1]}"
							`)

						kb.part(msg[1]);
						return `parted the channel ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} via database.`;
					}

					// if nothing was provided by an admin, display a default message
					if (!msg[0] && !msg[1]) {
						return `I'm active in ${length} channels, list of channels: https://kunszg.xyz/ 4Head`;
					}

					return `I'm active in ${length} channels, list of channels: https://kunszg.xyz/ 4Head`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "chat",
			aliases: prefix + "ct",
			description: `syntax: kb chat [message] | 
			message - provide a message to chat with the AI bot, no parameter will return error -- cooldown 1s`,
			permission: 0,
			cooldown: 4000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(" ")
						.splice(2);

					const json = await fetch(`https://some-random-api.ml/chatbot?message=
						${msg.join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
							.then(response => response.json());

					function capitalizeFirstLetter(string) {
						return string.charAt(0).toUpperCase() + string.slice(1);
					}

					if (!msg.join(" ")) {
						return `${user['username']}, please provide a text for me to respond to :)`;
					}

					if (msg.includes("homeless")) {
						return `${user['username']}, just get a house 4House`;
					} 

					if (msg.includes("forsen")) {
						return `${user['username']}, maldsen LULW`;
					} 

					if (((json.response.charAt(0).toLowerCase() + json.response.slice(1))
							.replace(".", " 4Head ")
							.replace("?", "? :) ")
							.replace("ń", "n")
							.replace("!", "! :o ")) === ''
						) {
							return `${user['username']}, [err CT1] - bad response monkaS`
						} 
					
					return `${user['username']}, ${(json.response.charAt(0).toLowerCase() + json.response.slice(1))
						.replace(".", " 4Head ")
						.replace("?", "? :) ")
						.replace("ń", "n")
						.replace("!", "! :o ")}`;
					
				} catch (err) {
					errorLog(err)
					if (err.message) {
						console.log(err.message);
						return `${user['username']}, an error occured while fetching data monkaS`;
					}
					return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "eval",
			aliases: null,
			description: `debugging command, permitted users only -- cooldown 10ms`,
			permission: 5,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message.split(" ").splice(2);
					const ping = await kb.ping();
					const women = {};
					const pi = require('pi-number');

					const rU = eval('"' + rUni({
						min: 0,
						max: 1114109
					}).replace('u', 'u{') + '}"');

					const shell = require('child_process');

					if (await checkPermissions(user['username'])<5) { 
						return '';
					}

					if (msg.join(" ").toLowerCase() === "return typeof supinic") {
						return "hackerman"
					}

					if (msg.join(" ").toLowerCase().includes("api")) {
						return user['username'] + ', api key :/'
					}

					function reverse(s) {
						return s.split('').reverse().join('');
					}

					function hasNumber(myString) {
						return /\d/.test(myString);
					}

					function sleep(milliseconds) {
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}

					function escapeUnicode(str) {
						return str.replace(/[^\0-~]/g, function(ch) {
							return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
						});
					}
					const ev = await eval('(async () => {' +
						msg.join(" ").replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') + '})()');
					console.log(ev)
					return String(ev);

				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "pattern",
			aliases: null,
			description: `permitted users syntax: kb pattern [fast/slow] [pyramid/triangle] [height] [message] | 
			Invalid or missing parameter will return an error -- cooldown 10ms`,
			permission: 3,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(2);
					const emote = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
					const msgP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(4);
					const emoteP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
				
					const patterns = [{
							pattern: 'pyramid'
						},
						{
							pattern: 'square'
						},
						{
							pattern: 'circle'
						},
						{
							pattern: 'triangle'
						}
					];

					const cases = [{
							case: 'slow'
						},
						{
							case: 'fast'
						}
					];

					const caseChosen = cases.filter(
						i => i.case === msg[0]
					);

					const patternChosen = patterns.filter(
						i => i.pattern === msg[1]
					);

					function hasNumber(myString) {
						return /\d/.test(myString);
					}

					function sleep(milliseconds) {
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > milliseconds) {
								break;
							}
						}
					}

					if (await checkPermissions(user['username'])<3) { 
						return '';
					}

					if (!msg[0]) {
						return user['username'] + ', no parameters provided (fast, slow) [err#1]';
					} 

					if (!caseChosen[0] || msg[0] != caseChosen[0].case) {
						return user['username'] + ', invalid first parameter (fast, slow) [err#2]';
					} 

					if (!patternChosen[0] || msg[1] != patternChosen[0].pattern) {
						return user['username'] + ', invalid second parameter (' +
							patterns.map(i => i.pattern).join(', ') + ') [err#3]';
					} 

					if (!msg[2] || !hasNumber(msg[2])) {
						return user['username'] + ', invalid third parameter (number) [err#4]';
					} 

					if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
						return user['username'] + ', invalid fourth parameter (word) [err#5]';
					} 

					if (user['user-id'] != '178087241' && msg[2] > 15) {
						return user['username'] + ", i can't allow pyramids higher than 15 😬";
					}

					if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'pyramid') {
						function createPyramid(height) {
							for (var i = 1; i <= height; i++) {
								var row = '';

								for (var j = 1; j <= i; j++)
									row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
								kb.say(channel, row);
							}
							for (var i = height - 1; i > 0; i--) {
								var row = '';

								for (var j = i; j > 0; j--)
									row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
								kb.say(channel, row);
							}
						}
						createPyramid(msgP[0]);
						return "";
					} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'pyramid') {
						function createPyramid(height) {
							for (var i = 1; i <= height; i++) {
								var row = '';

								for (var j = 1; j <= i; j++)
									row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
								kb.say(channel, row);
								sleep(1500);
							}
							for (var i = height - 1; i > 0; i--) {
								var row = '';

								for (var j = i; j > 0; j--)
									row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
								kb.say(channel, row);
								sleep(1500);
							}
						}
						createPyramid(msgP[0]);
						return "";
					} else if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'triangle') {
						const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

						function createTriangle(height) {
							for (var i = 1; i <= height; i++) {
								kb.say(channel, (' ' + randomE + ' ').repeat(i))
							}
						}
						createTriangle(msgP[0]);
						return '';
					} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'triangle') {
						const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

						function createTriangle(height) {
							for (var i = 1; i <= height; i++) {
								kb.say(channel, (' ' + randomE + ' ').repeat(i))
								sleep(1300);
							}
						}
						createTriangle(msgP[0]);
						return '';
					} else if (patternChosen[0].pattern != 'pyramid' && 
						patternChosen[0].pattern != 'triangle') {
							return user['username'] + ', currently supporting only pyramid/triangle.'
						}
				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "locate",
			aliases: prefix + "location",
			description: `syntax: kb locate [IP/message] | IP - provide an IP adress to search for its location | 
			message - provide a non-numeric message to search for its location -- cooldown 6s`,
			permission: 0,
			cooldown: 6000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
					.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
					.split(" ")
					.splice(2);

					function hasNumber(myString) {
						return /\d/.test(myString);
					}
					const locate = await fetch("http://api.ipstack.com/" +
							msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '?access_key='+api.locate)
						.then(response => response.json());

					if (locate.type != null && hasNumber(msg[0])) {
						return user['username'] + ", location for " + msg + " => type: " + locate.type + ", country: "+
							locate.country_name + ", region: " + locate.region_name + ", city: " +
							locate.city + " monkaS";
					} else {
						if (!msg[0]) {
							return user['username'] + ", please provide an IP or location to search :)";
						} else if (!hasNumber(msg[0]) && msg[0].match(/^\w+$/)) {
							const location = await fetch(api.geonames + msg
								.join(' ')
								.normalize("NFD")
								.replace(/[\u0300-\u036f]/g, "") + '&maxRows=1&username=kunszg')
								.then(response => response.json());
							return user['username'] + ', results: ' + location.totalResultsCount + " | location: " +
								location.geonames[0].countryName.replace("ń", "n") + ", " +
								location.geonames[0].adminName1.replace("ń", "n") + ", " +
								location.geonames[0].name.replace("ń", "n") + " | population: " +
								location.geonames[0].population + ", info: " +
								location.geonames[0].fcodeName;
						} else if (!msg[0].match(/^\w+$/) && !msg[0].includes('.')) {
							return user['username'] +
								', special character detected HONEYDETECTED'
						} else {
							return user['username'] +
								", could not find given location or location does not exist KKona";
						}
					}
				} catch (err) {
					errorLog(err)
					if (err.message.includes("read property")) {
						return user['username'] + ", location not found.";
					} else {
						return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') +
							" FeelsDankMan !!!";
					}
				}
			}
		},

		{
			name: prefix + "twitter",
			aliases: null,
			description: `syntax: kb twitter [account] | no parameter - returns an error | 
			account - returns latest tweet from specified user -- cooldown 8s`,
			permission: 0,
			cooldown: 6000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message.split(" ").splice(2);
					const fetchUrl = require("fetch").fetchUrl;
					const tweet = await new Promise((resolve, reject) => {
						fetchUrl(api.twitter + msg[0], function(error, meta, body) {
							if (error) {
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					if (!msg[0]) {
						return user['username'] + ', no account	name provided, see "kb help twitter" for explanation';
					} else {
						return user['username'] + ", " + tweet.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
					}

				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '') +
						" FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + "hosts",
			aliases: null,
			description: `kb hosts [input] - get users that are hosting a specified channel 
			(in input), no input will return an error -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message.split(" ").splice(2);
					const hosts = await fetch(api.hosts + msg[0])
						.then(response => response.json());
					const hostlist = hosts.sort().map(function(e) {

						return e.replace(/^(.{2})/, "$1\u{E0000}")
							.split("")
							.reverse()
							.join("")
							.replace(/^(.{2})/, "$1\u{E0000}")
							.split("")
							.reverse()
							.join("")

					}); //character \u{06E4}
					if (!msg[0]) {
						return user['username'] + ", no channel provided.";
					} else {
						if (hosts.length < 25 && hosts.length != 0) {
							return user['username'] + ", users hosting " +
								msg[0].replace(/^(.{2})/, "$1\u{E0000}")
								.split("")
								.reverse()
								.join("")
								.replace(/^(.{2})/, "$1\u{E0000}")
								.split("")
								.reverse()
								.join("") + " PagChomp 👉  " + hostlist.join(", ");
						} else if (hosts.length > 25) {
							return user['username'] + ", channel " +
								msg[0].replace(/^(.{2})/, "$1\u{E0000}")
								.split("")
								.reverse()
								.join("")
								.replace(/^(.{2})/, "$1\u{E0000}")
								.split("")
								.reverse()
								.join("") + " is being hosted by " + hosts.length + " users";
						} else if (hosts.length === 0) {
							return user['username'] + ", channel is not being hosted by any user :("
						} else {
							return user['username'] + ", something fucked up eShrug";
						}
					}

				} catch (err) {
					errorLog(err)
					const msg = message.split(" ").splice(2);
					const fetchUrl = require("fetch").fetchUrl;
					const foo = await new Promise((resolve, reject) => {
						fetchUrl(api.hosts + msg[0], function(error, meta, body) {
							if (error) {
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					return user['username'] + ", " + foo
				}
			}
		},

		{
			name: prefix + "rp",
			aliases: prefix + "randomplaysound",
			permission: 'restricted',
			description: `interaction command with Supibot's $ps command, 
			sends a random playsound to appear on stream -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
						.then(response => response.json());
					const randomPs = playsound.data.playsounds[Math.floor(Math.random() *
						playsound.data.playsounds.length)]
					if (channel === "#supinic") {
						return '$ps ' + randomPs.name;
					}
					return "";

				} catch (err) {
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: prefix + '4Head',
			aliases: prefix + '4head',
			description: `says a random joke related to programming or other stuff -- cooldown 4s`,
			permission: 0,
			cooldown: 4000,
			invocation: async (channel, user, message, args) => {
				try {

					const arr = [
						'general',
						'general',
						'general',
						'general',
						'general',
						'programming',
						'programming'
					];

					function lCase(string) {
						return string.charAt(0).toLowerCase() + string.slice(1);
					}

					const randomPs = arr[Math.floor(Math.random() * arr.length)];

					if (randomPs === 'programming') {
						const joke = await fetch(api.joke1)
							.then(response => response.json());
						const spongeCase = require('sponge-case')
						setTimeout(() => {
							kb.say(channel, spongeCase.spongeCase(lCase(joke[0].punchline.replace(/\./g, '')) + ' 4HEad'))
						}, 3000);
						return user['username'] + ', ' + lCase(joke[0].setup);
					} else if (randomPs === 'general') {
						const jokeGeneral = await fetch(api.joke2)
							.then(response => response.json());

						setTimeout(() => {
							kb.say(channel, spongeCase.spongeCase(lCase(jokeGeneral.punchline.replace(/\./g, '')) + ' 4HEad'))
						}, 3000);
						return user['username'] + ', ' + lCase(jokeGeneral.setup);
					}

				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "fl",
			aliases: prefix + "firstline",
			description: `kb fl [input] - first line from database in current channel for given user, 
			no input will return a first line of the executing user -- cooldown 2s`,
			permission: 0,
			cooldown: 4000,
			invocation: async (channel, user, message, args) => {
				try {

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
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}

					const checkChannel = await doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
					if (checkChannel.length === 0) {
						return `${user['username']}, I'm not logging this channel, 
						therefore I can't display data for this command :/`;
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);

					if (!msg[0]) {
						const firstline = await doQuery('SELECT * FROM logs_' + channel.replace('#', '') +
						' WHERE username="' + user['username'] + '" ORDER BY DATE ASC');
						if (!firstline[0]) {
							return user['username'] + ", I don't have any logs from that user";
						}

						function modifyOutput(modify) {
							if (!modify) {
								return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}:
								${firstline[0].message.substr(0, 350)}`;
							} else {
								return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
								${firstline[0].message.substr(0, modify)}`;
							}
						}

						const serverDate = new Date().getTime();
						const timeDifference = (Math.abs(serverDate - 
							(new Date(firstline[0].date).getTime())))/1000/3600;
						const timeDifferenceRaw = (Math.abs(serverDate - (new Date(firstline[0].date).getTime())));

						if (await banphrasePass(firstline[0].message).banned === true) {
							if (channel==="#nymn") {
								if (timeDifference>48) {
									kb.whisper(user['username'], ', Your first line in this channel was: (' + 
										(timeDifference/24).toFixed(0) + 'd' + modifyOutput());
								} else {
									kb.whisper(user['username'], ', Your first line in this channel was: (' +
									 format(timeDifferenceRaw/1000) + modifyOutput());
								}
								return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
							}

							if (timeDifference>48) {
								return user['username'] + ', Your first line in this channel was: (' +  
								(timeDifference/24).toFixed(0) + 'd' + modifyOutput();
							}
							return user['username'] + ', Your first line in this channel was: (' + 
							format(timeDifferenceRaw/1000) + modifyOutput();
							
						}

						if (channel === "#nymn") {
							if (timeDifference>48) {
								return user['username'] + ', Your first line in this channel was: (' + 
								(timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);
							}
							return user['username'] + ', Your first line in this channel was: (' + 
							format(timeDifferenceRaw/1000) + modifyOutput(130);	
						} 

						if (timeDifference>48) {
							return user['username'] + ', Your first line in this channel was: (' + 
							(timeDifference/24).toFixed(0) + 'd' + modifyOutput();
						}
						return user['username'] + ', Your first line in this channel was: (' + 
						format(timeDifferenceRaw/1000) + modifyOutput();

					} else {

						// check if user exists in the database
						const checkIfUserExists = await doQuery(`SELECT * FROM user_list WHERE username="${msg[0]}"`);
						if (checkIfUserExists.length === 0) {
							return `${user['username']}, this user does not exist in my user list logs.`;
						}
						
						const sql = 'SELECT * FROM logs_' + channel.replace('#', '') + 
						' WHERE username=? ORDER BY DATE ASC';
						const inserts = [msg[0]];
						const firstline = await doQuery(mysql.format(sql, inserts));

						if (!firstline[0]) {
							return user['username'] + ", I don't have any logs from that user";
						}

						function modifyOutput(modify) {
							if (!modify) {
								return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
								${firstline[0].message.substr(0, 350)}`;
							} else {
								return ` ago) ${firstline[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
								${firstline[0].message.substr(0, modify)}`;
							}
						}
					
						const serverDate = new Date().getTime();
						const timeDifference = (Math.abs(serverDate - 
							(new Date(firstline[0].date).getTime())))/1000/3600;
						const timeDifferenceRaw = (Math.abs(serverDate - (new Date(firstline[0].date).getTime())));
					
						if (await banphrasePass(firstline[0].message).banned === true) {
							if (channel==="#nymn") {
								if (timeDifference>48) {
									kb.whisper(user['username'], ', first line of that user in this channel: (' + 
										(timeDifference/24).toFixed(0) + 'd' + modifyOutput());
								} else {
									kb.whisper(user['username'], ', first line of that user in this channel: (' + 
										format(timeDifferenceRaw/1000) + modifyOutput());
								}
								return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
							}
							
							if (timeDifference>48) {
								return user['username'] + ', first line of that user in this channel: (' + 
								(timeDifference/24).toFixed(0) + 'd' + modifyOutput();
							}
							return user['username'] + ', first line of that user in this channel: (' + 
							format(timeDifferenceRaw/1000) + modifyOutput();
						}
						
						if (channel === "#nymn") {
							if (timeDifference>48) {
								return user['username'] + ', first line of that user in this channel: (' + 
								(timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);				
							}
							return user['username'] + ', first line of that user in this channel: (' + 
							format(timeDifferenceRaw/1000) + modifyOutput(130);
						}
						
						if (timeDifference>48) {
							return user['username'] + ', first line of that user in this channel: (' + 
							(timeDifference/24).toFixed(0) + 'd' + modifyOutput();	
						}
						return user['username'] + ', first line of that user in this channel: (' + 
						format(timeDifferenceRaw/1000) + modifyOutput();	
					}
				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "rl",
			aliases: prefix + "randomline",
			description: `kb rl [input] - random line from current chat, use input to get random line from a 
			specified user, no input will return a random quote -- cooldown 2s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {
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
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}		

					const checkChannel = await doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
					if (checkChannel.length === 0) {
						return `${user['username']}, I'm not logging this channel, 
						therefore I can't display data for this command :/`;
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);

					const serverDate = new Date().getTime();

					if (!msg[0]) {
						const maxID = await doQuery(
							'SELECT MAX(ID) AS number FROM logs_' + channel.replace('#', '')
							);

						// get random ID from the range of ID's in database
						const randNum = Math.floor(Math.random() * (maxID[0].number - 1)) + 1;
						const randomLine = await doQuery(`SELECT ID, username, message, date FROM 
							logs_${channel.replace('#', '')} WHERE ID="${randNum}"`);
						if (!randomLine[0]) {
							return user['username'] + ", I don't have any logs from this channel :z";
						}

						function modifyOutput(modify) {
							if (!modify) {
								return ` ago) ${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
								${randomLine[0].message.substr(0, 350)}`;
							} else {
								return ` ago) ${randomLine[0].username.replace(/^(.{2})/, "$1\u{E0000}")}: 
								${randomLine[0].message.substr(0, modify)}`;
							}
						}

						const timeDifference = (Math.abs(serverDate - 
							(new Date(randomLine[0].date).getTime())))/1000/3600;
						const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine[0].date).getTime())));

						// check for banphrases...
						if (await banphrasePass(randomLine[0].message).banned === true) {
							if (channel==="#nymn") {
								if (timeDifference>48) {
									kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' +
									 modifyOutput());
								} else {
									kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + 
										modifyOutput());
								}
								return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
							}
							
							if (timeDifference>48) {
								return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();	
							}
							return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
						}

						// check for channels
						if (channel === "#nymn") {
							if (timeDifference>48) {
								return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);
							}
							return '(' + format(timeDifferenceRaw/1000) + modifyOutput(130);
						}

						// other channels
						if (timeDifference>48) {
							return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
						}
						return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
						
					} else if (typeof msg[0] !== 'undefined' && msg[0] != '') {

						// check if user exists in the database
						const checkIfUserExists = await doQuery(`SELECT * FROM user_list WHERE username="${msg[0]}"`);
						if (checkIfUserExists.length === 0) {
							return `${user['username']}, this user does not exist in my user list logs.`;
						}

						const getLines = await doQuery(`SELECT username, message, date FROM 
							logs_${channel.replace('#', '')} WHERE username="${msg[0]}"`);
						const randomLine = getLines[Math.floor(Math.random() * getLines.length)]

						if (!randomLine) {
							return user['username'] + ', there are no logs in my database related to that user.';
						}
						const timeDifference = (Math.abs(serverDate - 
							(new Date(randomLine.date).getTime())))/1000/3600;
						const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine.date).getTime())));

						function modifyOutput(modify) {
							if (!modify) {
								return ' ago) ' + randomLine.username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' + 
								randomLine.message.substr(0, 350);
							} else {
								return ' ago) ' + randomLine.username.replace(/^(.{2})/, "$1\u{E0000}") + ': ' + 
								randomLine.message.substr(0, modify);
							}
						}
						// check for banphrases...
						if (await banphrasePass(randomLine.message).banned === true) {
							if (channel==="#nymn") {
								if (timeDifference>48) {
									kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' + 
										modifyOutput());
								} else {
									kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + 
										modifyOutput());
								}
								return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
							}

							// other channels
							if (timeDifference>48) {
								return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
							}
							return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
						}

						// check for channels
						if (channel === "#nymn") {
							if (timeDifference>48) {
								return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(130);	
							}
							return '(' + format(timeDifferenceRaw/1000) + modifyOutput(130);
						}

						// other channels
						if (timeDifference>48) {
							return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
						} 
						return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
					} 
				} catch (err) {
					errorLog(err)
					return user['username'] + ' ' + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + 'rq',
			aliases: prefix + 'randomquote',
			description: `Your random quote from the current chat -- cooldown 2s`,
			permission: 0,
			cooldown: 3000,
			invocation: async (channel, user, message, args) => {
				try {
					const serverDate = new Date().getTime();
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
							if ((minutes === 0 && hours === 0) && seconds != 0) {
								return seconds + "s"
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}
					const checkChannel = await doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
					if (checkChannel.length === 0) {
						return `${user['username']}, I'm not logging this channel, therefore I can't display 
						data for this command :/`;
					}

					const getLines = await doQuery(`SELECT username, message, date 
						FROM logs_${channel.replace('#', '')} WHERE username="${user['username']}"`);
					const randomLine = getLines[Math.floor(Math.random() * getLines.length)]

					if (!randomLine) {
						return user['username'] + ", I don't have any logs from this channel :z";
					}

					function modifyOutput(modify) {
						if (!modify) {
							return ` ago) ${randomLine.username}: ${randomLine.message.substr(0, 350)}`;
						} else {
							return ` ago) ${randomLine.username}: ${randomLine.message.substr(0, modify)}`;
						}
					}

					const timeDifference = (Math.abs(serverDate - (new Date(randomLine.date).getTime())))/1000/3600;
					const timeDifferenceRaw = (Math.abs(serverDate - (new Date(randomLine.date).getTime())));

					// if the output is banphrased...
					if (await banphrasePass(randomLine.message).banned === true) {
						if (channel==="#nymn") {
							if (timeDifference>48) {
								kb.whisper(user['username'], '(' + (timeDifference/24).toFixed(0) + 'd' +
								modifyOutput());
							} else {
								kb.whisper(user['username'], '(' + format(timeDifferenceRaw/1000) + modifyOutput());
							}
							return user['username'] + ', result is banphrased, I whispered it to you tho cmonBruh';
						}

						if (timeDifference>48) {
							return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
						}
						return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
					}
					
					// if output is fine...
					// make the messages more strict
					if (channel==="#nymn") {
						if (timeDifference>48) {
							return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput(100);
						}
						return '(' + format(timeDifferenceRaw/1000) + modifyOutput(100);
					}

					// other channels
					if (timeDifference>48) {
						return '(' + (timeDifference/24).toFixed(0) + 'd' + modifyOutput();
					} 
					return '(' + format(timeDifferenceRaw/1000) + modifyOutput();
				} catch (err) {
					errorLog(err)
					return user['username'] + err + ' FeelsDankMan !!!';
				}
			}
		},

		{
			name: prefix + "dank",
			aliases: null,
			description: `kb dank [input] - dank other person (use input) or 
			yourself (without input) FeelsDankMan -- cooldown 2s`,
			permission: 0,
			cooldown: 4000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(" ")
						.splice(2);

					if (!msg.join(' ')) {
						return `${user['username']}, FeelsDankMan oh zoinks, you just got flippin' 
						danked by yourself FeelsDankMan FeelsDankMan FeelsDankMan`;
					}

					// check if user exists in the database
					const checkIfUserExists = await doQuery(`
						SELECT * 
						FROM user_list 
						WHERE username="${msg[0]}"
						`);

					if (checkIfUserExists.length === 0) {
						return `${user['username']}, this user does not exist in my user list logs.`;
					}

					return `${user['username']}, you just danked ${msg.join(' ')} FeelsDankMan 👍`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "help",
			aliases: null,
			description: `syntax: kb help [command] | no parameter - shows basic information about bot,
			it's owner and host | command - shows description of a specified command -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.toLowerCase()
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					// if there is no parameter given, return basic command message
					if (!msg[0]) {
						return `${user['username']}, kunszgbot is owned by KUNszg, sponsored by 
						${'Leppunen'.replace(/^(.{2})/, "$1\u{E0000}")}, Node JS ${process.version}, running on 
						Ubuntu 19.10 GNU/${process.platform} ${process.arch}, for commands list use 'kb commands'.`;
					} 

					if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0])) {
						
						// filter for command names matching the given parameter
						if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) &&
							commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]).length != 0) {
							
								// if there is a specified command and the description exists - respond
								return `${user['username']}, ${commands.filter((i => 
									i.name.substring(3).toLowerCase() === msg[0])).map(i => i.description)[0]}`;
							}

						if (commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]) &&
							commands.filter(i => i.name.substring(3).toLowerCase() === msg[0]).length === 0) {
								// if specified command does not exist, throw an error
								throw 'command does not exist.';
							}

						if (!(commands.filter(
							(i => i.name.substring(3).toLowerCase() === msg[0])).map(i => i.description))) {
								// if specified command exists but there is no description for it, throw an error
								throw 'description for that command does not exist.';
							}
					}
				
					// if something else that is not handled happens, throw an error
					throw 'internal error monkaS';
				
				} catch (err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' ';
				}
			}
		},

		{
			name: prefix + "joemama",
			aliases: prefix + "mama",
			description: `random "your mom" joke -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const fetchUrl = require("fetch").fetchUrl;
					const joemama = await new Promise((resolve, reject) => {
						fetchUrl(api.joemama, function(error, meta, body) {
							if (error) {
								console.log(error);
								reject(error)
							} else {
								resolve(body.toString())
							}
						})
					});
					const laughingEmotes = [
						' 😬',
						' 4Head',
						' 4HEad',
						' ArgieB8',
						' FreakinStinkin',
						' AlienPls',
						' 🔥',
						' FireSpeed',
						' ConcernDoge',
						' haHAA',
						' CruW',
						' :O',
						' >(',
						' OMEGALUL',
						' LULW',
						' CurseLit',
						' 😂'
					]
					const emotesJoke = laughingEmotes[Math.floor(Math.random() * laughingEmotes.length)]

					function lCase(string) {
						return string.charAt(0).toLowerCase() + string.slice(1);
					}

					return `${user['username']}, ${lCase(joemama.split('"')[3])} ${emotesJoke}`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "restart",
			aliases: null,
			description: `restart [logger] | logger - restarts the logger | 
			no parameter - restarts the bot -- cooldown 10ms`,
			permission: 4,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					if (await checkPermissions(user['username'])<4) { 
						return '';
					}

					const shell = require('child_process');
					
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

						kb.say(channel, `restarting with -f flag and pulling from @master 
							PogChamp 👉 ${await pullFromRepo}`);

						setTimeout(() => {
							shell.execSync(`pm2 restart ${msg[0]}`);
						}, 1000);

						return '';
					}

					// restart bot.js
					if (!msg[0]) {

						// pull from repo
						kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

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
						kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

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
						kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

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
						kb.say(channel, `pulling from @master PogChamp 👉 ${await pullFromRepo}`);

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
						}, 4200);
						return '';
					} 

					return 'imagine forgetting your own syntax OMEGALUL';

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + 'github',
			aliases: prefix + 'git',
			description: `link to my github repo and last commit timer -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const commits = await fetch('https://api.github.com/repos/KUNszg/kbot/commits')
						.then(response => response.json());

					const commitDate = new Date(commits[0].commit.committer.date);
					const serverDate = new Date();
					const diff = Math.abs(commitDate - serverDate)
					const DifftoSeconds = (diff / 1000).toFixed(2);

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
							} else if (seconds === 0 || hours === 0 && minutes === 0) {
								return 'just now!'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}

					return `${user['username']}, my public repo Okayga 👉 https://github.com/KUNszg/kbot 
					last commit: ${format(DifftoSeconds)} ago`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + 'suggest',
			aliases: null,
			description: `kb suggest [input] - suggest something for me to improve/change in my bot -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);

					if (!msg[0]) {
						return user['username'] + ', no message provided FeelsDankMan';
					}

					const checkRepeatedSql = 'SELECT message FROM suggestions WHERE message=?';							
					const checkRepeatedInsert = [msg.join(' ')];
					const query = await doQuery(mysql.format(checkRepeatedSql, checkRepeatedInsert));

					if (!query[0]) {

						const sql = `
							INSERT INTO suggestions (username, message, created) 
							VALUES (?, ?, CURRENT_TIMESTAMP)
							`;

						const insert = [user['username'], msg.join(' ')];
						await doQuery(mysql.format(sql, insert));

						const selectSql = `
							SELECT ID 
							FROM suggestions 
							WHERE message=?
							`;

						const selectInsert = [msg.join(' ')];
						const suggestionID = await doQuery(mysql.format(selectSql, selectInsert));

						return `${user['username']}, suggestion saved with ID ${suggestionID[0].ID} PogChamp`;
					}
					return `${user['username']}, duplicate suggestion.`;
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + 'cookie',
			aliases: null,
			description: `usage: kb cookie [register/unregister/status/whisper/silence] | register - register 
			in database. | unregister - unregister from the database. | status - see your reminder status | 
			whisper - set the feedback message to appear in whispers. | silence - mute the feedback. -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);
					

					const resultsRegister = await doQuery(`
						SELECT * 
						FROM cookie_reminders 
						WHERE username="${user['username']}"
						`);

					switch (msg[0]) {

						case 'module':
							if (await checkPermissions(user['username'])<3) { 
								return '';
							}
							await doQuery(`
								UPDATE cookieModule 
								SET reminders="${msg[1]}" 
								WHERE type="cookie"
								`);

							return `updated "cookie" module status to ${msg[1]}`;

						case 'force':
							const cookieApi = await fetch(`https://api.roaringiron.com/cooldown/${user['username']}`)
								.then(response => response.json());

							const regCheck = await doQuery(`
								SELECT * 
								FROM cookie_reminders 
								WHERE username="${user['username']}"
								`);

							const now = new Date();

							// check if user is registered
							if (regCheck.length === 0) {
								return `${user['username']}, you are not registered in the database, 
								use "kb cookie register" to do so.`;
							}

							if (cookieApi.seconds_left === 0) {
								return `${user['username']}, you can eat your cookie right now! (?cookie)`;
							}

							Date.prototype.addMinutes = function(minutes) {
								const copiedDate = new Date(this.getTime());
								return new Date(copiedDate.getTime() + minutes * 1000);
							}

							async function updateReminder(time) {

								await doQuery(`
									UPDATE cookie_reminders 
									SET (
										channel="${channel.replace('#', '')}", 
										fires="${now.addMinutes(time).toISOString().slice(0, 19).replace('T', ' ')}", 
										status="scheduled"
										) 
									WHERE username="${user['username']}"
									`);

								await doQuery(`
									UPDATE cookie_reminders 
									SET cookie_count="${countCookie[0].cookie_count + 1}" 
									WHERE username="${user['username']}"
									`)
							}

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
									} else if (seconds === 0 || hours === 0 && minutes === 0) {
										return 'few seconds'
									} else {
										return hours + 'h ' + minutes + 'm ' + seconds + "s";
									}
								}
							}

							updateReminder(cookieApi.seconds_left.toFixed(0))
							return `${user['username']}, I will remind you to eat the cookie in 
							${format(cookieApi.seconds_left.toFixed(0))} (forced reminder)`;

						case 'register':
							// check if user is new and insert a new row in database
							if (resultsRegister.length === 0) {

								await doQuery(`
									INSERT INTO cookies (username, created) 
									VALUES ("${user['username']}", CURRENT_TIMESTAMP)
									`);

								await doQuery(`
									INSERT INTO cookie_reminders (username) 
									VALUES ("${user['username']}")
									`);

								return `${user['username']}, you have been successfully registered for 
								a cookie reminder, see "kb help cookie" for exclusive commands PogChamp`;
							} 

							// check if user is already registered
							if (resultsRegister[0].username === user['username']) {
								return `${user['username']}, you are already registered for cookie reminders, use 
								"kb help cookie" for command syntax.`;
							}
							return '';

						case 'unregister':
							// check if user is registered and delete rows from database
							const resultsUnregister = await doQuery(`
								SELECT username 
								FROM cookies 
								WHERE username="${user['username']}"
								`);

							if (resultsUnregister != 0) {

								await doQuery(`
									DELETE FROM cookies 
									WHERE username="${user['username']}"
									`);

								await doQuery(`
									DELETE FROM cookie_reminders 
									WHERE username="${user['username']}"
									`);

								return `${user['username']}, you are no longer registered for a cookie reminder.`;
							}
							return `${user['username']}, you are not registered for a 
							cookie reminder, therefore you can't be unregistered FeelsDankMan`
						
						case 'whisper':
							// check if user is registered
							if (resultsRegister.length === 0 || 
								resultsRegister[0].username === 0) {
									return `${user['username']}, you are not registered in my database, 
									check out "kb help cookie" to do so.`;
 								} 

 							// when user uses command the first time (feedback in whispers)
 							if (resultsRegister[0].username === user['username'] && 
 								resultsRegister[0].initplatform === 'channel') {

	 								await doQuery(`
	 									UPDATE cookie_reminders 
	 									SET initplatform="whisper" 
	 									WHERE username="${user['username']}"
	 									`);

	 								return `${user['username']}, you have changed your feedback message to appear in 
	 								whispers (note that your reminders will still appear in the channel where you 
	 								executed them). Type this command again to undo it.`;
								} 

							// when user uses the command 2nd time (feedback as default in channel)
							if (resultsRegister[0].username === user['username'] && 
								resultsRegister[0].initplatform === 'whisper') {

									await doQuery(`
										UPDATE cookie_reminders 
										SET initplatform="channel" 
										WHERE username="${user['username']}"
										`);

	 								return `${user['username']}, you have changed your feedback message to appear in 
	 								your own channel (note that reminders are still going to fire in the channel where 
	 								you executed them). Type this command again to undo it.`;
 								} 

 							// swap from silence to default feedback message
 							if (resultsRegister[0].username === user['username'] && 
 								resultsRegister[0].initplatform === "silence") {

	 								await doQuery(`
	 									UPDATE cookie_reminders 
	 									SET initplatform="channel" 
	 									WHERE username="${user['username']}"
	 									`);

	 								return `${user['username']}, you have changed your feedback message to appear in 
	 								your own channel (note that your reminders will still appear in the channel where
 								 	you executed them). Type this command again to set them to whispers.`;
								}
							return '';

						case 'silence':
							// check if user is registered
							if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
								return `${user['username']}, you are not registered in my database, 
								check out "kb help cookie" to do so.`;
 							} 

 							// change the feedback message to silence if it's already not set
 							if (resultsRegister[0].username === user['username'] && 
 								resultsRegister[0].initplatform != 'silence') {

 									await doQuery(`
 										UPDATE cookie_reminders 
 										SET initplatform="silence" 
 										WHERE username="${user['username']}"
 										`);

 									return `${user['username']}, you will no longer receive 
 									feedback from the cookie command.`;
 								} 
							return `${user['username']}, you are already marked to not receive the feedback.`;

						case 'status':
							// check if user is registered
							if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {
								return `${user['username']}, you are not registered in my database, 
								check out "kb help cookie" to do so.`;
 							} 

 							const getData = await doQuery(`
 								SELECT * FROM cookie_reminders
 								 WHERE username="${user['username']}"
 								 `)

 							return `${user['username']}, you have used cookie reminders ${getData[0].cookie_count} 
 							times | feedback message is set to ${getData[0].initplatform} | your current reminder 
 							status - ${getData[0].status}`;

						default:
							return `${user['username']}, invalid syntax. See "kb help cookie" for command help.`;
					}
					return '';
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + 'ed',
			aliases: null,
			description: `after "kb ed" type register/unregister to register or unregister from the database 
			-- cooldown 10s`,
			permission: 0,
			cooldown: 10000,
			invocation: async (channel, user, message, args) => {
				try {
					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2);

					switch (msg[0]) {

						case 'module':
							if (await checkPermissions(user['username'])<3) { 
								return '';
							}
							await doQuery(`
								UPDATE cookieModule 
								SET reminders="${msg[1]}" 
								WHERE type="ed"
								`);

							return`updated "ed" module status to ${msg[1]}`;
						case 'force':
							sleepGlob(1500)
							const edApi = await fetch(`https://huwobot.me/api/user?id=${user['user-id']}`)
								.then(response => response.json());

							const regCheck = await doQuery(`
								SELECT * 
								FROM ed_reminders 
								WHERE username="${user['username']}"
								`);

							const now = new Date();

							// check if user is registered
							if (regCheck.length === 0) {
								return `${user['username']}, you are not registered in the database, 
								use "kb ed register" to do so.`;
							}

							if (edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000) === 0) {
								return `${user['username']}, you can enter the dungeon right now! (+ed)`;
							}

							Date.prototype.addMinutes = function(minutes) {
								const copiedDate = new Date(this.getTime());
								return new Date(copiedDate.getTime() + minutes * 1000);
							}

							async function updateReminder(time) {

								await doQuery(`
									UPDATE ed_reminders 
									SET (
										channel="${channel.replace('#', '')}", 
										fires="${now.addMinutes(time).toISOString().slice(0, 19).replace('T', ' ')}", 
										status="scheduled"
										) 
									WHERE username="${user['username']}"
									`);
							}

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
									} else if (seconds === 0 || hours === 0 && minutes === 0) {
										return 'few seconds'
									} else {
										return hours + 'h ' + minutes + 'm ' + seconds + "s";
									}
								}
							}

							updateReminder(edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000))
							kb.whispered(user['username'], `I will remind you to enter dungeon in 
								${format(edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000))} (forced reminder)`);

						case 'register':
							const resultsRegister = await doQuery(`
								SELECT username 
								FROM ed 
								WHERE username="${user['username']}"
								`);
							
							if (resultsRegister.length === 0 || resultsRegister[0].username === 0) {

								await doQuery(`
									INSERT INTO ed (username, created) 
									VALUES ("${user['username']}", CURRENT_TIMESTAMP)
									`);

								await doQuery(`
									INSERT INTO ed_reminders (username) 
									VALUES ("${user['username']}")
									`);

								return `${user['username']}, you have been successfully registered for a dungeon 
								reminder, Your reminders will be whispered to you.`;

							} 

							if (resultsRegister[0].username === user['username']) {
								return `${user['username']}, you are already registered for dungeon reminders, 
								type "kb help ed" for command syntax.`;
							}
							return '';

						case 'unregister':
							const resultsUnregister = await doQuery(`
								SELECT username FROM ed 
								WHERE username="${user['username']}"
								`);

							if (resultsUnregister != 0) {
								await doQuery(`
									DELETE FROM ed 
									WHERE username="${user['username']}"
									`);

								await doQuery(`
									DELETE FROM ed_reminders 
									WHERE username="${user['username']}"
									`);

								return `${user['username']}, you are no longer registered for a dungeon reminder.`;
							}
							return `${user['username']}, you are not registered for a dungeon reminder, 
							therefore you can't be unregistered FeelsDankMan`;

						default:
							return `${user['username']}, invalid syntax. See "kb help ed" for command help.`;
					}
					return '';
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		// todo - replace promises with await doQuery() 
		{
			name: prefix + 'stats',
			aliases: null,
			description: `syntax: kb stats -channel / -bruh / [input] / @[user] | no parameter - information about your 
			logs in my database | -channel - information about the current channel | -bruh - amount of racists in the 
			chat | [input] - provide a custom message | @[user] - searches for given user -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {
					const msgRaw = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);
					const msg = msgRaw


					const channelParsed = channel.replace('#', '')
					const fetch = require('node-fetch');
					commandsExecuted.push('1');
					const checkChannel = await doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)

					if (checkChannel.length === 0) {
						return `${user['username']}, I'm not logging this channel, 
						therefore I can't display stats for it :/`;
					}

					// if no parameters provided...
					if (((msg[0] != "-channel" && msg[0] != "-bruh") && msg.length != 0)) {	

						// kb stats @[user] [message]			
						if (msg.filter(i => i.startsWith('@')).toString().includes('@')) {

							// check if user exists in the database
							const checkIfUserExists = await doQuery(`
								SELECT * FROM user_list 
								WHERE username="${msg.filter(i=>i.startsWith('@'))[0].replace('@', '')}"
								`);

							if (checkIfUserExists.length === 0) {
								return `${user['username']}, this user does not exist in my user list logs.`;
							}
							
							// check if user provided a user in flag
							if (msg.filter(i => i.startsWith('@'))[0].replace('@', '').length === 0) {
								return `${user['username']}, wrong flag syntax, no user after "@" provided`;
							}
							
							// check if user provided enough characters
							if (msg.filter(i => !i.startsWith('@')).join(' ').length<3) {
								return `${user['username']}, provided word has not enough characters to run a query.`;
							}
							
							// check if user provided any message to search for
							if (!msg.filter(i => !i.startsWith('@'))) {
								return `${user['username']}, no search query provided with the 
								given flag, eg.: kb stats @kunszg nam`;
							}
							
							// check for internal banphrases
							const getInternalBans = await doQuery('SELECT * FROM internal_banphrases');
							const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase))
							if (checkIfBanned.length != 0) {
								return `${user['username']}, I cannot search with this query, 
								it contains an internally banned phrase.`;
							}
							
							// get the message
							const sql = `
								SELECT message, username FROM ?? 
								WHERE message LIKE ? AND username=? 
								ORDER BY RAND() 
								LIMIT 1;
								`;

							const inserts = [
								`logs_${channelParsed}`, '%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%', 
								msg.filter(i => i.startsWith('@'))[0].replace('@', '')
								];
							
							// get the occurence
							const sql2 = `
								SELECT message, COUNT(message) AS value_occurance 
								FROM logs_${channelParsed} 
								WHERE message LIKE ? AND username=? 
								GROUP BY message 
								ORDER BY value_occurance 
								DESC 
								LIMIT 1;
								`;

							const inserts2 = [
								'%'+msg.filter(i => !i.startsWith('@')).join(' ')+'%', 
								msg.filter(i => i.startsWith('@'))[0].replace('@', '')
								];

							const compile = await Promise.all([
								doQuery(mysql.format(sql, inserts)), 
								doQuery(mysql.format(sql2, inserts2))
								]);
							
							// check if there are any logs for specified user
							if (compile[0].length === 0) {
								return `${user['username']}, no message logs found for that query 
								or related to that user.`;
							}

							function modifyOutput(modify) {
								if (!modify) {
									return `${user['username']}, messages similar to 
									" ${compile[0][0].message.substr(0, 255)} " have been typed 
									${compile[1][0].value_occurance} times in this channel by user 
									${compile[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
								} else {
									return `${user['username']}, messages similar to 
									" ${compile[0][0].message.substr(0, modify)} " have been typed
									 ${compile[1][0].value_occurance} times in this channel by user 
									 ${compile[0][0].username.replace(/^(.{2})/, "$1\u{E0000}")}.`;
								}
							}

							if (channel === '#nymn') {

								// check for banned phrases
								const getInternalBans = await doQuery('SELECT * FROM internal_banphrases');
								const checkIfBanned = getInternalBans.filter(i => msg.join(' ').includes(i.banphrase))
								if (checkIfBanned.length != 0) {
									return `${user['username']}, I cannot search with this query, 
									it contains an internally banned phrase.`;
								}
							
								if (compile[0][0].message.toString().length>50) {
								
									// check if response would cause timeout in the channel
									if (await banphrasePass(modifyOutput()).banned === true) {
										kb.whisper(`${user['username']}, ${modifyOutput()}`);
										return `${user['username']}, the result is banphrased, 
										I whispered it to you tho cmonBruh`;
									}
									return modifyOutput(50);
								}
							
								// less than 50 characters
								if (await banphrasePass(modifyOutput()).banned === true) {
									kb.whisper(user['username'], modifyOutput());
									return `${user['username']}, the result is banphrased, 
									I whispered it to you tho cmonBruh`;
								} 
								return modifyOutput(50);
							}
							if (compile[0][0].message.toString().length>255) {
						
								// check if response would cause timeout in the channel
								if (await banphrasePass(modifyOutput()).banned === true) {
									kb.whisper(`${user['username']}, ${modifyOutput()}`);
									return `${user['username']}, the result is banphrased, 
									I whispered it to you tho cmonBruh`;
								}
								return modifyOutput();
							}
				
							// less than 500 characters
							if (await banphrasePass(modifyOutput()).banned === true) {
								kb.whisper(user['username'], modifyOutput());
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							} 
							return modifyOutput();

						// kb stats [message]
						} else {

							// check if query has enough characters
							if (msg.join(' ').length<3) {
								return `${user['username']}, provided word has not enough characters to run a query.`;
							} 

							// positional query
							const sql = `
								SELECT message FROM ?? 
								WHERE MATCH(message) AGAINST (?) 
								ORDER BY RAND() 
								LIMIT 1;
								`;

							const inserts = [`logs_${channelParsed}`, `'"*${msg.join(' ')}*"'`]
							const sql2 = `
								SELECT count(*) AS value_occurance 
								FROM ?? 
								WHERE MATCH(message) AGAINST (?);
								`;

							const inserts2 = [`logs_${channelParsed}`, `'"*${msg.join(' ')}*"'`]
							const occurence = await Promise.all([
								doQuery(mysql.format(sql, inserts)), 
								doQuery(mysql.format(sql2, inserts2))
								])

							// check if there are any message logs for given query
							if (occurence[0].length === 0) {
								return `${user['username']}, no message logs found for that query`;
							}

							function modifyOutput(modify) {
								if (!modify) {
									return `${user['username']}, messages similar to 
									" ${occurence[0][0].message.substr(0, 255)} " have been typed 
									${occurence[1][0].value_occurance} times in this channel.`;
								} else {
									return `${user['username']}, messages similar to 
									" ${occurence[0][0].message.substr(0, modify)} " have been typed 
									${occurence[1][0].value_occurance} times in this channel.`;
								}
							}

							if (channel === '#nymn') {

								// check for banphrases
								const getInternalBans = await doQuery(`
									SELECT * 
									FROM internal_banphrases
									`);

								const checkIfBanned = getInternalBans
									.filter(i => msg.join(' ')
									.includes(i.banphrase))

								if (checkIfBanned.length != 0) {
									return `${user['username']}, I cannot search with this query, 
									it contains an internally banned phrase.`;
								}
								// check if response exceeds 500 characters limit
								if (occurence[0][0].message.toString().length>50) {
									// check if response would cause timeout in the channel
									if (await banphrasePass(modifyOutput()).banned === true) {
										kb.whisper(user['username'], modifyOutput());
										return `${user['username']}, the result is banphrased, 
										I whispered it to you tho cmonBruh`;
									}
									return modifyOutput(50);
								}
								if (await banphrasePass(modifyOutput()).banned === true) {
									kb.whisper(user['username'], modifyOutput());
									return `${user['username']}, the result is banphrased, 
									I whispered it to you tho cmonBruh`;
								}
								return modifyOutput(50);
							}
							// check if response exceeds 500 characters limit
							if (occurence[0][0].message.toString().length>500) {
								// check if response would cause timeout in the channel
								if (await banphrasePass(modifyOutput()).banned === true) {
									kb.whisper(user['username'], modifyOutput());
									return `${user['username']}, the result is banphrased, 
									I whispered it to you tho cmonBruh`;
								}
								return modifyOutput();
							}
							if (await banphrasePass(modifyOutput()).banned === true) {
								kb.whisper(user['username'], modifyOutput());
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							}
							return modifyOutput();
						}
					} else if (msg[0] === "-channel") {

						const values = await Promise.all([
						
							// amount of rows
							doQuery(`
								SELECT COUNT(*) AS value 
								FROM logs_${channelParsed}
								`),
						 	
							// table size
						 	doQuery(`
						 		SELECT TABLE_NAME 
						 			AS ` + '`' + 'Table' + '`' + `, (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 
									AS size FROM information_schema.TABLES 
								WHERE TABLE_NAME = "logs_${channelParsed}" 
								ORDER BY (DATA_LENGTH + INDEX_LENGTH) 
								DESC;
								`),

						 	// create time
						 	doQuery(`
						 		SELECT date AS create_time 
						 		FROM logs_${channelParsed} 
						 		ORDER BY date 
						 		ASC 
						 		LIMIT 1
						 		`) 
					 	])

						// date formatting
						const logsDate = new Date(values[2][0].create_time);
						const serverDate = new Date();
						const difference = Math.abs(serverDate - logsDate);
						const differenceToSec = difference/1000;

						return `${user['username']}, this channel has ${values[0][0].value}
						lines logged, which is ${values[1][0].size.substring(0, 4)} MB total. 
						Logs in this channel started ${(differenceToSec/86400).toFixed(0)} days ago`;
					} else if (msg[0] === "-bruh") {

						// kb stats -bruh
						if (!msg[1]) {

							// count the words in the channel
							const channelValue = await doQuery(`
								SELECT COUNT(*) AS valueCount 
								FROM logs_${channelParsed} 
								WHERE message LIKE "%nigg%"
								`);

							// count the words in the channel for sender
							const userValue = await doQuery(`
								SELECT COUNT(*) AS value 
								FROM logs_${channelParsed} 
								WHERE (message LIKE "%nigg%") AND username="${user['username']}"
								`);

							// channel specific responses
							if (channel === '#haxk') {
								if (userValue[0].value<2 && userValue[0].value != 1) {
									return `${user['username']}, you have spelled it ${userValue[0].value} times, 
									we coo TriHard - total of ${channelValue[0].valueCount} n bombs in this channel 
									TriChomp TeaTime`;
								} 
								if (userValue[0].value===1) {
									return `${user['username']}, you have spelled it ${userValue[0].value} time 
									WideHard - total of ${channelValue[0].valueCount} n bombs in this channel 
									TriChomp TeaTime`;
								}
								return `${user['username']}, you have spelled it ${userValue[0].value} 
								times TriChomp Clap - total of ${channelValue[0].valueCount} n bombs in this channel 
								TriChomp TeaTime`;
							} else {
								if (channelValue[0].valueCount === 0) {
									return `${user['username']}, total of ${channelValue[0].valueCount} racists 
									in this channel, we coo TriHard Clap`;
								}
								return `${user['username']}, total of ${channelValue[0].valueCount} racists 
								in this channel cmonBruh`;
							}

						// kb stats -bruh [user]
						} else {

							// check if user exists in the database
							const checkIfUserExists = await doQuery(`
								SELECT * FROM user_list 
								WHERE username="${msg[1]}"
								`);

							// check if channel exists in user_list logs
							if (checkIfUserExists.length === 0) {
								return `${user['username']}, this user does not exist in my user list logs.`;
							}

							const channelValue = await doQuery(`
								SELECT COUNT(*) AS valueCount 
								FROM logs_${channelParsed} 
								WHERE username="${msg[1]}" AND (message LIKE "%nigg%")
								`);

							const userValue = await doQuery(`
								SELECT COUNT(*) AS value 
								FROM logs_${channelParsed} 
								WHERE (message LIKE "%nigg%") AND username="${msg[1]}"
								`);

							if (msg[1].toLowerCase() === 'teodorv') {
								return `${user['username']}, that user has opted out from this command.`; 
							}
							
							// replace second character in user's name with an invisible character to prevent the ping
							const userNoPing = msg[1].replace(/^(.{2})/, "$1\u{E0000}");

							if (channel === '#haxk') {
								if (userValue[0].value<2 && userValue[0].value != 1) {
									return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
									times, we coo TriHard`;
								}  
								if (userValue[0].value===1){
									return` ${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
									time WideHard`;
								}
								return `${user['username']}, user ${userNoPing} has spelled it ${userValue[0].value} 
								times TriChomp Clap`;
							} 
							
							if (channelValue[0].valueCount === 0) {
								return `${user['username']} total of ${channelValue[0].valueCount} racist activities 
								by user ${userNoPing} we coo TriHard Clap`;
							}
							return `${user['username']} total of ${channelValue[0].valueCount} racist activities 
							by user ${userNoPing} in this channel cmonBruh bruh`
						}

					// kb stats
					} else {

						// get amout lines of sender user in the current channel
						const values = await doQuery(`
							SELECT COUNT(username) as value 
							FROM logs_${channelParsed} 
							WHERE username="${user['username']}"
							`)

						// all lines in the channel
						const occurence = await	 doQuery(`
							SELECT COUNT(username) as value 
							FROM logs_${channelParsed}
							`)

						// channel lines occurence
						const val = await doQuery(`
							SELECT message, COUNT(message) AS value_occurance 
							FROM logs_${channelParsed} 
							WHERE username="${user['username']}" AND (
								message NOT LIKE "?%" 
								AND message NOT LIKE "+%" 
								AND message NOT LIKE "kb%" 
								AND message NOT LIKE "$%" 
								AND message NOT LIKE "!%" 
								AND message NOT LIKE "&%" 
								AND message NOT LIKE "-%"
								) 
							GROUP BY message 
							ORDER BY value_occurance 
							DESC 
							LIMIT 1;
							`)

						// manage the output message lengths
						function modifyOutput(modify) {
							if (!modify) {
								return `${user['username']}, you have total of ${values[0].value} lines logged, 
								that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}% 
								of all lines in this channel, your most frequently typed message: " 
								${val[0].message.substr(0, 255)} " (${val[0].value_occurance} times)`;
							} else {
								return `${user['username']}, you have total of ${values[0].value} lines logged, 
								that's ${((values[0].value / occurence[0].value) * 100).toFixed(2)}% 
								of all lines in this channel, your most frequently typed message: " 
								${val[0].message.substr(0, modify)} " (${val[0].value_occurance} times)`;
							}
						}
						if (channel === "#nymn") {
							// if response has more than 100 characters, truncate it	
							if (val[0].message.toString().length>100) {
								if (await banphrasePass(modifyOutput()).banned === true) {
									kb.whisper(user['username'], modifyOutput());
									return `${user['username']}, the result is banphrased, 
									I whispered it to you tho cmonBruh`;
								}
								return modifyOutput(100);
							}
							if (await banphrasePass(modifyOutput()).banned === true) {
								kb.whisper(user['username'], modifyOutput());
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							}
							return modifyOutput(100);
						}
						// if response has more than 300 characters, truncate it	
						if (val[0].message.toString().length>300) {
							if (await banphrasePass(modifyOutput()).banned === true) {
								kb.whisper(user['username'], modifyOutput());
								return `${user['username']}, the result is banphrased, 
								I whispered it to you tho cmonBruh`;
							}
							return modifyOutput(300);
						}
							
						if (await banphrasePass(modifyOutput()).banned === true) {
							kb.whisper(user['username'], modifyOutput());
							return `${user['username']}, the result is banphrased, 
							I whispered it to you tho cmonBruh`;
						}
						return modifyOutput(300);
					}	
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "surah",
			aliases: prefix + "dailysurah",
			description: `random verse from quran -- cooldown 8s`,
			permission: 0,
			cooldown: 8000,
			invocation: async (channel, user, message, args) => {
				try {
					const randomNumberFromRange = Math.floor(Math.random() * 6237) + 1;
					const quranApi = await fetch(`
						http://api.alquran.cloud/ayah/${randomNumberFromRange}/editions/quran-uthmani,en.pickthall`
						)
						.then(response => response.json());
					const output = `
						${quranApi.data[0].surah.englishName} - ${quranApi.data[0].surah.englishNameTranslation}: 
						${quranApi.data[0].text.split(' ').reverse().join(' ')} - ${quranApi.data[1].text} 
						${quranApi.data[0].page}:${quranApi.data[0].surah.numberOfAyahs}`;
					if (channel === "#nymn") {

						// if output contains banned phrases
						if (await banphrasePass(output).banned === true) {
							kb.whisper(user['username'], output);
							return `${user['username']}, the result is banphrased, I whispered it to you tho cmonBruh`;		
						} 

						// if output is fine, return full message
						return `${user['username']}, ${output}`;
					}
					
					// other channels
					return `${user['username']}, ${output}`;
				} catch (err) {
					errorLog(err)
					return `user${['username']}, ${err} FeelsDankMan!!!`
				}
			}	
		},

		{
			name: prefix + "hug",
			aliases: prefix + "kiss",
			description: "kb [hug/kiss] [user] - hug or kiss a user to make their day better :) -- cooldown 5s",
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(1)

					const msgRaw = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					if (!msgRaw[0]) {
						return `${user['username']}, you should provide a user to hug/kiss, 
							there is someone like that for sure FeelsOkayMan`;
					}

					if (msg[0] === "hug") {
						if (channel === "#nymn") {
							return `${user['username']} hugs ${msgRaw[0]} PeepoHappy FBCatch`;
						} 
						if (channel === "#haxk") {
							return `${user['username']} hugs ${msgRaw[0]} forsenHug`;
						} 
						return `${user['username']} hugs ${msgRaw[0]} 🤗 <3 ily`;
					}
					if (channel === "#nymn") {
						return `${user['username']} kisses ${msgRaw[0]} PeepoHappy 💋`;
					}
					return `${user['username']} kisses ${msgRaw[0]} 😗 💋 `;
				} catch (err) {
					errorLog(err)
					return `${user['username']} ${err} FeelsDankMan !!!`;
				}	
			}
		},

		{
			name: prefix + "website",
			aliases: prefix + "site",
			description: `link to my project's website`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {
				try {
					return `${user['username']}, https://kunszg.xyz/`;
				} catch (err) {
					errorLog(err)
					return `${user['username']} ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "ban",
			aliases: null,
			description: `ban a user`,
			permission: 3,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					
					if (await checkPermissions(user['username'])<3) { 
						return '';
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					const comment = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(3)
						.filter(Boolean);

					const userid = await fetch(`https://api.ivr.fi/twitch/resolve/${msg[0]}`)
						.then(response => response.json());

					const checkRepeatedInsert = await doQuery(`SELECT * FROM ban_list WHERE user_id="${userid.id}"`);

					if (checkRepeatedInsert.length != 0) {
						return `${user['username']}, user with ID ${userid.id} is already banned.`;
					}

					if (comment.length != 0) {
						if (!comment.join(' ').startsWith('//')) {
							return `${user['username']}, syntax error, use // before comments.`;
						}

						// insert into the database to ban the user (if there is a comment)
						await doQuery(`INSERT INTO ban_list (username, user_id, comment, date) 
							VALUES ("${msg[0]}", "${userid.id}", "${comment.join(' ').replace('//', '')}", 
							CURRENT_TIMESTAMP)`);

						return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;
					}

					// insert into the database to ban the user (if there is no comment)
					await doQuery(`INSERT INTO ban_list (username, user_id, date) 
						VALUES ("${msg[0]}", "${userid.id}", CURRENT_TIMESTAMP)`);

					return `${user['username']}, user with ID ${userid.id} is now banned from the bot.`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`;
				}
			}
		},

		{
			name: prefix + "unban",
			aliases: null,
			description: `unban a user`,
			permission: 3,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					if (await checkPermissions(user['username'])<3) { 
						return '';
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					const comment = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(3)
						.filter(Boolean);

					const userid = await fetch(`https://api.ivr.fi/twitch/resolve/${msg[0]}`)
						.then(response => response.json());

					const checkRepeatedInsert = await doQuery(`SELECT * FROM ban_list WHERE user_id="${userid.id}"`);

					if (checkRepeatedInsert.length === 0) {
						return `${user['username']}, no such user found in the database.`;
					}

					// delete the row with unbanned user
					await doQuery(`DELETE FROM ban_list WHERE username="${msg[0].toLowerCase()}"`);

					// insert into a table to store previously banned users
					await doQuery(`INSERT INTO unbanned_list (username, user_id, date) 
						VALUES ("${msg[0]}", "${userid.id}", CURRENT_TIMESTAMP)`)

					return `${user['username']}, user with ID ${userid.id} has been unbanned from the bot`;	
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`
				}
			}
		},

		{
			name: prefix + "banphrase",
			aliases: prefix + "bp",
			cooldown: 10,
			permission: 3,
			description: 'add or remove banphrase - (+, -, add, del) -- cooldown 10ms',
			invocation: async (channel, user, message, args) => {
				try {

					if (await checkPermissions(user['username'])<3) { 
						return '';
					}

					// syntax check
					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					if (!msg[0]) {
						return `${user['username']}, no parameter provided`;
					}

					// add banphrase
					if (msg[0] === "add" || msg[0] === "+") { 
						
						// check for repeated inserts
						const checkRepeated = await doQuery(`
							SELECT * FROM internal_banphrases 
							WHERE banphrase="${msg[1]}"
							`);

						if (checkRepeated.length != 0) {
							return `${user['username']}, this banphrase already exists.`;
						}

						await doQuery(`
							INSERT INTO internal_banphrases (banphrase, date) 
							VALUES ("${msg[1]}", CURRENT_TIMESTAMP)
							`);

						const getID = await	doQuery(`
							SELECT * FROM internal_banphrases 
							WHERE banphrase="${msg[1]}"
							`);

						return `${user['username']}, successfully added a banphrase 
						"${msg[1]}" with ID ${getID[0].ID}.`;
					}

					// remove banphrase
					if (msg[0] === "del" || msg[0] === "-") {
						
						// check if banphrase exists
						const checkRepeated = await doQuery(`
							SELECT * FROM internal_banphrases 
							WHERE banphrase="${msg[1]}"
							`);

						if (checkRepeated.length === 0) {
							return `${user['username']}, this banphrase doesn't exist.`;
						}

						await doQuery(`
							DELETE FROM internal_banphrases 
							WHERE banphrase="${msg[1]}"
							`)

						return `${user['username']}, successfully removed the banphrase.`;
					}

					return `${user['username']}, invalid parameter.`
				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`
				}
			}
		},

		{
			name: prefix + "id",
			aliases: prefix + "ID",
			description: `usage: kb id [user] | user - provide a user to see his ID and first seen timestamp | 
			no parameter - shows your ID and first seen timestamp -- cooldown 5s`,
			permission: 0,
			cooldown: 5000,
			invocation: async (channel, user, message, args) => {	
				try {
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
							} else if (seconds === 0 || hours === 0 && minutes === 0) {
								return 'few seconds'
							} else {
								return hours + 'h ' + minutes + 'm ' + seconds + "s";
							}
						}
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);
					
					if (!msg[0]) {

						// get data about sender user from database
						const getSenderData = await doQuery(`
							SELECT * FROM user_list 
							WHERE userId="${user['user-id']}"
							`);

						// check if user exists in user_list
						if (getSenderData.length === 0) {
							return `${user['username']}, you are not being logged in my database.`;
						}

						const dateDiff = Math.abs((new Date()) - (new Date(getSenderData[0].added))) 
						const dateToSec = (dateDiff/1000).toFixed(0)

						// if user was seen more than 4 days ago
						if (dateToSec>259200) {
							return `${user['username']}, Your internal user ID is ${getSenderData[0].ID}, 
							you were first seen by the bot ${((dateToSec/3600).toFixed(0)/24).toFixed(0)} ago.`;
						}

						// if user was seen less than 4 days ago
						return `${user['username']}, Your internal user ID is ${getSenderData[0].ID},
						you were first seen by the bot ${format(dateToSec)} ago.`;
					}

					// get of given user data if user was specified
					const getUserData = await doQuery(`
						SELECT * FROM user_list 
						WHERE username="${msg[0]}"
						`);

					// check if user exists in user_list
					if (getUserData.length === 0) {
						return `${user['username']}, that user does not exist in my database.`;
					}

					const dateDiff2 = Math.abs((new Date()) - (new Date(getUserData[0].added)))
					const dateToSec2 = (dateDiff2/1000).toFixed(0)

					// if user was seen more than 4 days ago
					if (dateToSec2>259200) {
						return `${user['username']}, user ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")} 
						has internal ID ${getUserData[0].ID} and was first seen by the bot 
						${((dateToSec2/3600).toFixed(0)/24).toFixed(0)} days ago.`;
					}

					// if user was seen less than 4 days ago
					return `${user['username']}, user ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")} 
					has internal ID ${getUserData[0].ID} and was first seen by the bot ${format(dateToSec2)} ago.`;

				} catch (err) {
					errorLog(err)
					return `${user['username']}, ${err} FeelsDankMan !!!`
				}
			}
		},

		{
			name: prefix + "query",
			aliases: null,
			permission: 5,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {

					if (user['user-id'] != '178087241') {
						return '';
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					const queryResp = await doQuery(`${msg.join(' ')}`);
					if ((msg.join(' ').toLowerCase().includes('insert') || 
						msg.join(' ').toLowerCase().includes('update')) || 
						msg.join(' ').toLowerCase().includes('delete')) {
							return '';
						}
					
					if (!msg.join(' ').includes('query')) {
						return `${user['username']}, forgot to add "As query" to the string FeelsDankMan !!!`;
					} 

					return queryResp[0].query

				} catch (err) {
					errorLog(err);
					kb.whisper('kunszg', err);
				}
			}
		},

		{
			name: prefix + "trust",
			aliases: null,
			description: `usage: kb trust [user] [permission] | set permissions for user to allow him to use restricted
			and unlisted commands. -- cooldown 10ms`,
			permission: 5,
			cooldown: 10,
			invocation: async (channel, user, message, args) => {
				try {
					if (await checkPermissions(user['username'])<5) { 
						return '';
					}

					const msg = message
						.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
						.split(' ')
						.splice(2)
						.filter(Boolean);

					if (!msg[0]) {
						return `${user['username']}, no user provided.`;
					}

					if (!msg[1]) {
						return `${user['username']}, no permission specified.`;
					}

					const checkIfExists = await doQuery(`
						SELECT *
						FROM user_list
						WHERE username="${msg[0]}";
						`);

					if (checkIfExists.length === 0) {
						return `${user['username']}, this user does not exist in my database.`;
					}

					const checkTrustedList = await doQuery(`
						SELECT *
						FROM trusted_users
						WHERE username="${msg[0]}"
						`)

					if (msg[1] === "active") {
						if (checkTrustedList.length === 0) {
							return `${user['username']}, this user is not in the trusted users list.`;
						}
						if (checkTrustedList[0].status === "active") {
							return `${user['username']}, this user is already set with that status.`
						}
						if (checkTrustedList[0].status === "inactive") {
							await doQuery(`
								UPDATE trusted_users 
								SET status="active" 
								WHERE username="${msg[0]}"
								`)
							return `${user['username']}, changed trusted user status of ${msg[0]} to active`;
						}
					}

					if (msg[1] === "inactive") {
						if (checkTrustedList.length === 0) {
							return `${user['username']}, this user is not in the trusted users list.`;
						}
						if (checkTrustedList[0].status === "inactive") {
							return `${user['username']}, this user is already set with that status.`
						}
						if (checkTrustedList[0].status === "active") {
							await doQuery(`
								UPDATE trusted_users 
								SET status="inactive" 
								WHERE username="${msg[0]}"
								`)
							return `${user['username']}, changed trusted user status of ${msg[0]} to inactive`;
						}
					}

					if (checkTrustedList.length != 0 && checkTrustedList[0].permissions === msg[1]) {
						return `${user['username']}, this permission is already assigned to that user.`;
					}

					switch (msg[1]) {

						case '1':
						case 'superuser':
							if (checkTrustedList.length === 0) {
								await doQuery(`
									INSERT INTO trusted_users (username, permissions, status, added)
									VALUES ("${msg[0]}", "1:superuser", "active", CURRENT_TIMESTAMP)
									`);
							}
							await doQuery(`
								UPDATE trusted_users 
								SET permissions="1:superuser" 
								WHERE username="${msg[0]}"
								`);
							return `${user['username']}, changed trusted user permissons for ${msg[0]} to superuser.`;

						case '2':
						case 'mod':
							if (checkTrustedList.length === 0) {
								await doQuery(`
									INSERT INTO trusted_users (username, permissions, status, added)
									VALUES ("${msg[0]}", "2:mod", "active", CURRENT_TIMESTAMP)
									`);
							}
							await doQuery(`
								UPDATE trusted_users 
								SET permissions="2:mod" 
								WHERE username="${msg[0]}"
								`);
							return `${user['username']}, changed trusted user permissons for ${msg[0]} to mod.`;

						case '3':
						case 'admin':
							if (checkTrustedList.length === 0) {
								await doQuery(`
									INSERT INTO trusted_users (username, permissions, status, added)
									VALUES ("${msg[0]}", "3:admin", "active", CURRENT_TIMESTAMP)
									`);
							}
							await doQuery(`
								UPDATE trusted_users 
								SET permissions="3:admin" 
								WHERE username="${msg[0]}"
								`);
							return `${user['username']}, changed trusted user permissons for ${msg[0]} to admin.`;

						case '4':
						case 'editor':
							if (checkTrustedList.length === 0) {
								await doQuery(`
									INSERT INTO trusted_users (username, permissions, status, added)
									VALUES ("${msg[0]}", "4:editor", "active", CURRENT_TIMESTAMP)
									`);
							}
							await doQuery(`
								UPDATE trusted_users 
								SET permissions="4:editor" 
								WHERE username="${msg[0]}"
								`);
							return `${user['username']}, changed trusted user permissons for ${msg[0]} to editor.`;

						case '5':
						case 'contributor':
							if (checkTrustedList.length === 0) {
								await doQuery(`
									INSERT INTO trusted_users (username, permissions, status, added)
									VALUES ("${msg[0]}", "5:contributor", "active", CURRENT_TIMESTAMP)
									`);
							}
							await doQuery(`
								UPDATE trusted_users 
								SET permissions="5:contributor" 
								WHERE username="${msg[0]}"
								`);
							return `${user['username']}, changed trusted user permissons for ${msg[0]} to contributor.`;

						default:
							return `${user['username']}, this permission type does not exist.`
					}
					return `${user['username']}, [error] - eShrug something fucked up`;
				} catch (err) {
					errorLog(err);
					kb.whisper('kunszg', err);
				}
			}
		},

		{
			name: prefix + "commands",
			aliases: null,
			cooldown: 10000,
			permission: 0,
			invocation: async (channel, user, message, args) => {
				return '';
			}
		},
	];

	kb.on("chat", async (channel, user, message, self) => {
		const spongeCase = require('sponge-case')
		const input = message.split(' ')
		if (self) return;

		commands.forEach(async command => {
			if (
				((input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '').toLowerCase() 
					=== command.name) ||
				(command.aliases && (input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '')
					.toLowerCase() === command.aliases)
			) {
				let result2 = await command.invocation(channel, user, message);
				let result = spongeCase.spongeCase(result2.toString())

				// find the called command to check for cooldowns
				const getCommandName = commands.filter(i => 
					(i.name === (input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '')
						.toLowerCase()) || 
					(i.aliases && (input[0].replace('kbot', 'kb') + ' ' + input[1]).replace(/,/, '').replace('@', '')
						.toLowerCase() === i.aliases));

				// check for global cooldown
				if (user['username'] != "kunszg") {
					if (globalCooldown.has(user['username'] && user['username'])) {
						return '';
					}
					globalCooldown.add(user['username']);
					setTimeout(() => {
						globalCooldown.delete(user['username']);
					}, 3000);

					// check if user is on cooldown
					if (talkedRecently.has(user['username'] + '_' + getCommandName[0].name.replace('kb ', ''))) {
						return '';
					}
					talkedRecently.add(user['username'] + '_' + getCommandName[0].name.replace('kb ', ''));
					setTimeout(() => {
						talkedRecently.delete(user['username'] + '_' + getCommandName[0].name.replace('kb ', ''));
					}, getCommandName[0].cooldown);

					const checkBan = await doQuery(`SELECT * FROM ban_list WHERE user_id="${user['user-id']}"`);
					if (checkBan.length != 0) {
						return;
					}
					if (!result) {
						kb.say(channel, '');
						return;
					}
					if (repeatedMessages[channel] === result) {
						result += " \u{E0000}";
					}
					repeatedMessages[channel] = result;

					async function sendResponse() {
						const test = await banphrasePass(result);
						if (channel === '#nymn') {
							if (test.banned === true) {
								kb.say(channel, user['username'] +
									', the result is banphrased, I whispered it to you tho cmonBruh')
								kb.whisper(user['username'], result);
								return;
							}
							if (!result) {
								kb.say(channel, "");
								return;
							}
							if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === 
								"undefined") {
									kb.say(channel, 'Internal error monkaS')
									return;
								}
							if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							} 
							if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
								kb.say(channel, result);
							}
						} else {
							if (!result) {
								kb.say(channel, "");
								return;
							}
							if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === 
								"undefined") {
									kb.say(channel, 'Internal error monkaS')
									return;
								} 
							if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							} 
							if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
								kb.say(channel, result);
							}	
						}
					}
					sendResponse()
				} else {
					if (!result) {
						kb.say(channel, '');
						return;
					}
					if (repeatedMessages[channel] === result) {
						result += " \u{E0000}";
					}
					repeatedMessages[channel] = result;

					async function sendResponse() {
						const test = await banphrasePass(result);
						if (channel === '#nymn') {
							if (test.banned === true) {
								kb.say(channel, user['username'] +
									', the result is banphrased, I whispered it to you tho cmonBruh')
								kb.whisper(user['username'], result);
								return;
							}
							if (!result) {
								kb.say(channel, "");
								return;
							}
							if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === 
								"undefined") {
									kb.say(channel, 'Internal error monkaS')
									return;
								}
							if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							} 
							if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
								kb.say(channel, result);
							}
						} else {
							if (!result) {
								kb.say(channel, "");
								return;
							}
							if (result.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '') === 
								"undefined") {
									kb.say(channel, 'Internal error monkaS')
									return;
								} 
							if (result.toLowerCase().startsWith(kb.getOptions().identity.password)) {
								kb.say(channel, user['username'] + ', TriHard oauth key');
								return;
							} 
							if (result.toLowerCase() === 'object') {
								if (channel === '#nymn') {
									kb.say(channel, ' object peepoSquad')
									return;
								} else {
									kb.say(channel, ' object 🦍')
									return;
								}
							} else {
								commandsExecuted.push('1');
								kb.say(channel, result);
							}	
						}
					}
					sendResponse()
				}
			}	
		});
	});
	const talkedRecently3 = new Set();
	const commandlist = [{
		name: prefix + "commands",
		aliases: null,
		invocation: async (channel, user, args) => {
			try {

				const perm = await checkPermissions(user['username'])
				const trackObj = commands.filter(
					i => i.name && i.permission <= perm
				);

				const xd = trackObj.map(
					i => i.name
				);

				const xdd = ((xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |").split('|')).length;

				if (talkedRecently3.has(user['user-id'])) { //if set has user id - ignore
					return '';
				} else {
					talkedRecently3.add(user['user-id']);
					setTimeout(() => {
						// removes the user from the set after 10s
						talkedRecently3.delete(user['user-id']);
					}, 10000);
				}
				const xddd = xdd - 1
				
				if (perm === 0) {
					return user['username'] + ", " + xddd + " active commands PogChamp 👉 (prefix: kb) | " +
					xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |".split(' | ')
				}
				const getPermNames =  await doQuery('SELECT * FROM trusted_users WHERE username="' + user['username'] + '"') 
				return user['username'] + ", " + xddd + " active commands with your permissions PogChamp 👉 (" + getPermNames[0].permissions + ") | " +
				xd.sort().toString().replace(/,/g, " | ").replace(/kb/g, '') + " |".split(' | ')

			} catch (err) {
				async function errorLog() {
					const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
					const insert = [returnValue, new Date()];
					await doQuery(mysql.format(sql, insert));
				}
				errorLog()
				return user['username'] + ", " + err + " FeelsDankMan !!!";
			}
		}
	}, ];

	kb.on("chat", async (channel, user, message, self) => {
		const input = message.split(' ')
		const spongeCase = require('sponge-case')
		if (user['user-id'] === "441611405") return;
		if (user['user-id'] === "81613973") return;
		if (user['user-id'] === "176481960") return; // boiiiann
		if (self) return;
		commandlist.forEach(async command => {
			if (
				((input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.name) ||
				(command.aliases && (input[0].replace('kbot', 'kb') + ' ' +
					input[1]).replace(/,/, '').replace('@', '').toLowerCase() === command.aliases)
			) {
				let result2 = await command.invocation(channel, user, message);
				let result = spongeCase.spongeCase(result2.toString()) 

				// If a message would be duplicated in a row in a channel, add something to make it not duplicate
				if (repeatedMessages[channel] === result) {
					result += " \u{E0000}";
				}

				repeatedMessages[channel] = result;
				commandsExecuted.push('1');
				kb.say(channel, result);

			}
		})
	})

	async function sendOnlineStatusOnLaunc() { 
		await fetch(api.supinic, {
			method: 'PUT',
		}).then(response => response.json())
	} 
	setTimeout(() => { sendOnlineStatusOnLaunc() }, 5000);
	async function sendOnlineStatus() {
		const test = (await fetch(api.supinic, {
			method: 'PUT',
		}).then(response => response.json()))
	}
	setInterval(() => {
		sendOnlineStatus()
	}, 295000);

	const dankPrefix = '?';
	const talkedRecently2 = new Set();
	const dankeval = [
		{
			name: 'HONEYDETECTED',
			aliases: null,
			invocation: async (channel, user, message, args) => {
				if (user['user-id'] != '68136884') {
					return '';
				} else {
					return 'HONEYDETECTED POŁĄCZONO PONOWNIE KKurwa 7';
				}
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
					
					const cookieModule = await doQuery(`SELECT reminders FROM cookieModule WHERE type="cookie"`);
					if (cookieModule[0].reminders === "false") {
						return '';
					}
					
					const cookieApi = await fetch(`https://api.roaringiron.com/cooldown/${user['user-id']}?id=true`)
						.then(response => response.json());
					const query = await doQuery(`SELECT username FROM cookies WHERE username="${user['username']}"`);
					const updateCheck = await doQuery(`SELECT username, status FROM cookie_reminders WHERE 
						username="${user['username']}"`)
					const platformCheck = await doQuery(`SELECT initplatform, username FROM cookie_reminders WHERE 
						username="${user['username']}"`)
					const countCookie = await doQuery(`SELECT cookie_count FROM cookie_reminders WHERE 
						username="${user['username']}"`)
					const userChannel = `#${user['username']}`;
					const channelNoPing = channel.replace(/^(.{2})/, "$1\u{E0000}");
					if (query.length === 0) {
						return '';
					}

					commandsExecuted.push('1');
					
					Date.prototype.addMinutes = function(minutes) {
						const copiedDate = new Date(this.getTime());
						return new Date(copiedDate.getTime() + minutes * 1000);
					}
					const spongeCase = require('sponge-case')
					if (cookieApi.seconds_left<cookieApi.interval_unformatted-10 || cookieApi.seconds_left === 0) {
						if (cookieApi.time_left_formatted === 0) {
							return '';
						}
						
						kb.whisper(user['username'], spongeCase.spongeCase(`Your cookie is still on cooldown 
							(${cookieApi.time_left_formatted}) with ${cookieApi.interval_formatted} intervals.`));
						return '';
					} else {
				
						await doQuery(`UPDATE cookie_reminders SET cookie_count="${countCookie[0].cookie_count + 1}" 
							WHERE username="${user['username']}"`)
						const now = new Date();
						await doQuery(`UPDATE cookie_reminders 
							SET channel="${channel.replace('#', '')}", 
							fires="${now
								.addMinutes(`${cookieApi.interval_unformatted}`)
								.toISOString()
								.slice(0, 19)
								.replace('T', ' ')}", status="scheduled" 
							WHERE username="${user['username']}"`);

						if (platformCheck[0].initplatform === "channel") {
							if (updateCheck[0].status === "scheduled") {
								kb.say(userChannel, spongeCase.spongeCase(`${user['username']}, updating your pending cookie reminder, 
									I will remind you in ${cookieApi.interval_formatted} 
									(channel ${channelNoPing}) :D`));
							} else {
								kb.say(userChannel,	spongeCase.spongeCase(`${user['username']}, I will remind you to eat the cookie in 
									${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`));
							}
						} else if (platformCheck[0].initplatform === "whisper") {
							if (updateCheck[0].status === "scheduled") {
								kb.whisper(user['username'], spongeCase.spongeCase(`updating your pending cookie reminder, 
									I will remind you in ${cookieApi.interval_formatted} 
									(channel ${channelNoPing}) :D`));
							} else {
								kb.whisper(user['username'], spongeCase.spongeCase(`I will remind you to eat the 
									cookie in ${cookieApi.interval_formatted} (channel ${channelNoPing}) :)`));
							}
						} else if (platformCheck[0].initplatform === "silence") {
						 	return '';
						}
					}
					return '';
				} catch (err) {
					errorLog(err);
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
					sleepGlob(1500)
					if (talkedRecently2.has(user['user-id'])) { 
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 2000);
					}
					
					const cookieModule = await doQuery(`
						SELECT reminders 
						FROM cookieModule 
						WHERE type="ed"
						`);
					
					if (cookieModule[0].reminders === "false") {
						return '';
					}
				
					const checkUsername = await doQuery(`
						SELECT username 
						FROM ed 
						WHERE username="${user['username']}"`);
				
					if (checkUsername.length === 0) {
						return '';
				    }
					
					commandsExecuted.push("1");
			
					Date.prototype.addMinutes = function(minutes) {
						var copiedDate = new Date(this.getTime());
						return new Date(copiedDate.getTime() + minutes * 1000);
					}

					const getEdData = await fetch(`https://huwobot.me/api/user?id=${user['user-id']}`)
						.then(response => response.json());
					const now = new Date();
					const timeDiff = getEdData.next_entry - getEdData.last_entry;

					// check if ed is still pending, add 1h to timezone offset to match huwobot's timezone
					if (getEdData.next_entry.toFixed(0) > (Date.now(new Date())/1000)) {
						kb.whisper(user['username'], `Your dungeon entry is still on cooldown 
							(${format(getEdData.next_entry.toFixed(0) - (Date.now(new Date())/1000))})  
							to force-set your reminder use "kb ed force".`)
						return '';
					}

					kb.whisper(user['username'], 'I will remind you to enter the dungeon in 1h :)');

					const update = await doQuery(`
						UPDATE ed_reminders 
						SET (
							channel="${channel.replace('#', '')}", 
							fires="${now.addMinutes(timeDiff.toFixed(0)).toISOString().slice(0, 19).replace('T', ' ')}", 
							status="scheduled" 
							)
						WHERE username="${user['username']}"
						`);
					return '';
				} catch (err) {
					errorLog(err);
				}
			}
		},

		{
			name: "kunszgbot",
			aliases: "kunszgbot,",
			invocation: async (channel, user, message, args) => {
				try {
					if (talkedRecently2.has(user['user-id'])) {
						return '';
					} else {
						talkedRecently2.add(user['user-id']);
						setTimeout(() => {
							talkedRecently2.delete(user['user-id']);
						}, 30000);
					}
					if (user['user-id'] === '68136884') {
						return ''
					}
					return 'get 🅱️inged back ' + user['username'] + ' FeelsDankMan';
				} catch	(err) {
					errorLog(err)
					return user['username'] + ', ' + err + ' FeelsDankMan !!!';
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
					errorLog(err)
					return user['username'] + ", " + err + " FeelsDankMan !!!";
				}
			}
		},

		{
			name: "test",
			aliases: "test \u{E0000}",
			invocation: (channel, user, args) => {
				if (user['user-id'] === "178087241" || user['user-id'] === "229225576") { //kunszg
					return user['username'] + ", FeelsGoodMan test successful FeelsGoodMan";
				} else {
					return "";
				}
			}
		},
	];

	kb.on("chat", async (channel, user, message, self) => {
		if (self) return;
		const spongeCase = require('sponge-case')
		dankeval.forEach(async smart => {
			if ((message.split(' ')[0] === smart.name) ||
				(smart.aliases && message.split(' ')[0] === smart.aliases)) {
				let result2 = await smart.invocation(channel, user, message);
				let result = spongeCase.spongeCase(result2.toString())
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
				} else {
					commandsExecuted.push('1');
					kb.say(channel, result.toString());
				}
			}
		});
	});
	
	{
		kb.on('chat', async function(channels, user, message) {
			if (message.startsWith('`')) {
				
				if (await checkPermissions(user['username'])<3) { 
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

		//active commands
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
			} else if (channel==="#supinic"&&message.includes("$ps sneeze")) {
				if (talkedRecently.has(user['user-id'])) {
					return;
				} else {
					talkedRecently.add(user['user-id']);
					setTimeout(() => {
						talkedRecently.delete(user['user-id']);
					}, 5000);
				}
				kb.say('supinic', ' bless u peepoSadDank')
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
	}
}) 