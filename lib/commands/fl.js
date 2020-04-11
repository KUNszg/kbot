#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const prefix = "kb ";

module.exports = {
	name: prefix + "fl",
	aliases: null,
	description: `kb fl [input] - first line from database in current channel for given user, 
	no input will return a first line of the executing user -- cooldown 2s`,
	permission: 0,
	cooldown: 4000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2);

			/*	TODO	
			if (msg.find(i=>i.startsWith('#')).length != 0) {
				const msgParsed = msg.find(i=>i.startsWith('#'));
				const sql = `SHOW TABLES LIKE "logs_?"`;
				const inserts = [checkChannel];
				if (checkChannel.length === 0) {
					return `${user['username']}, I'm not logging this channel, 
					therefore I can't display data for this command :/`;
				}
			}
			*/

			const checkChannel = await custom.doQuery(`SHOW TABLES LIKE "logs_${channel.replace('#', '')}"`)
			if (checkChannel.length === 0) {
				return `${user['username']}, I'm not logging this channel, 
				therefore I can't display data for this command :/`;
			}

			if (!msg[0]) {
				const firstline = await custom.doQuery(`
					SELECT * 
					FROM logs_${channel.replace('#', '')} 
					WHERE username="${user['username']}" 
					LIMIT 1 
					OFFSET 0`
					);
				if (!firstline[0]) {
					return `${user['username']}, I don't have any logs from that user`;
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

				if (await custom.banphrasePass(firstline[0].message).banned === true) {
					if (channel==="#nymn") {
						if (timeDifference>48) {
							bot.kb.whisper(user['username'], `, Your first line in this channel was: 
								(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`);
						} else {
							bot.kb.whisper(user['username'], `, Your first line in this channel was: 
								(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`);
						}
						return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
					}

					if (timeDifference>48) {
						return `${user['username']}, Your first line in this channel was: 
						(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
					}
					return `${user['username']}, Your first line in this channel was: 
					(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`;
				}

				if (channel === "#nymn") {
					if (timeDifference>48) {
						return `${user['username']}, Your first line in this channel was: 
						(${(timeDifference/24).toFixed(0)}d ${modifyOutput(130)}`;
					}
					return `${user['username']}, Your first line in this channel was: 
					(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput(130)}`;	
				} 

				if (timeDifference>48) {
					return `${user['username']}, Your first line in this channel was: 
					(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
				}
				return `${user['username']}, Your first line in this channel was: 
				(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`;

			} else {

				// check if user exists in the database
				const checkIfUserExists = await custom.doQuery(`
					SELECT * 
					FROM user_list 
					WHERE username="${msg[0]}"
					`);
				if (checkIfUserExists.length === 0) {
					return `${user['username']}, this user does not exist in my user list logs.`;
				}
				
				const sql = `SELECT * FROM logs_${channel.replace('#', '')} WHERE username=? LIMIT 1 OFFSET 0`;
				const inserts = [msg[0]];
				const mysql = require('mysql2')
				const firstline = await custom.doQuery(mysql.format(sql, inserts));

				if (!firstline[0]) {
					return `${user['username']}, I don't have any logs from that user`;
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
				const timeDifferenceRaw = (Math.abs(serverDate - 
					(new Date(firstline[0].date).getTime())));
			
				if (await custom.banphrasePass(firstline[0].message).banned === true) {
					if (channel==="#nymn") {
						if (timeDifference>48) {
							bot.kb.whisper(user['username'], `, first line of that user in this channel: 
								(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`);
						} else {
							bot.kb.whisper(user['username'], `, first line of that user in this channel: 
								(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`);
						}
						return `${user['username']}, result is banphrased, I whispered it to you tho cmonBruh`;
					}
					
					if (timeDifference>48) {
						return `${user['username']}, first line of that user in this channel: 
						(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;
					}
					return `${user['username']}, first line of that user in this channel: 
					(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`;
				}
				
				if (channel === "#nymn") {
					if (timeDifference>48) {
						return `${user['username']}, first line of that user in this channel: 
						(${(timeDifference/24).toFixed(0)}d ${modifyOutput(130)}`;				
					}
					return `${user['username']}, first line of that user in this channel: 
					(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput(130)}`;
				}
				
				if (timeDifference>48) {
					return `${user['username']}, first line of that user in this channel: 
					(${(timeDifference/24).toFixed(0)}d ${modifyOutput()}`;	
				}
				return `${user['username']}, first line of that user in this channel: 
				(${custom.formatUptime(timeDifferenceRaw/1000)} ${modifyOutput()}`;	
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}