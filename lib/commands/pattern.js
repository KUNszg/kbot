#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const cd = new Set();

module.exports = {
	name: prefix + "pattern",
	aliases: null,
	description: `permitted users syntax: kb pattern [fast/slow] [pyramid/triangle] [height] [message] |
	Invalid or missing parameter will return an error -- cooldown 120s`,
	permission: 2,
	cooldown: 120000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(" ").splice(2).filter(Boolean);
			const emote = message.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(" ").splice(4).filter(Boolean);
			const msgP = message.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(" ").splice(3).filter(Boolean);
			const emoteP = message.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '').split(" ").splice(4).filter(Boolean);

			const patterns = [
				{ pattern: 'pyramid' },
				{ pattern: 'square' },
				{ pattern: 'inverse' },
				{ pattern: 'triangle' }
			];
			const patternChosen = patterns.filter(
				i => i.pattern === msg[0]
			);

			if (await custom.checkPermissions(user['username'])<2) {
				return '';
			}

			const checkChannelStatus = await custom.doQuery(`
				SELECT *
				FROM channels
				WHERE channel="${channel.replace('#', '')}"
				`);
			if (checkChannelStatus[0].status === "live" && checkChannelStatus[0].channel != 'haxk') {
				return;
			}

			if (!msg[0]) {
				return `${user['username']}, no parameters provided (pyramid, triangle) [err#1]`;
			}
			if(msg[1].toLowerCase() === "infinity") {
				return `${user['username']}, infinite pyramids are a lie 4Head`;
			}
			if (!patternChosen[0] || msg[0] != patternChosen[0].pattern) {
				return `${user['username']}, invalid first parameter
				(${patterns.map(i => i.pattern).join(', ')}) [err#3]`;
			}
			if (!msg[1] || !custom.hasNumber(msg[1])) {
				return `${user['username']}, invalid second parameter (number) [err#4]`;
			}
			if (msg[1] < 2) {
				return `${user['username']}, cannot build a pyramid smaller than 2 FeelsDankMan`;
			}
			if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
				return `${user['username']}, invalid third parameter (word) [err#5]`;
			}

			if (user['user-id'] != '178087241') {
				if (msg[1]>7 && Number(await custom.checkPermissions(user['username']))>=3) {
					return `${user['username']}, I can't allow pyramids higher than 7 for your permissions 😬`;
				}

				if (msg[1]>4 && await custom.checkPermissions(user['username'])==2) {
					return `${user['username']}, I can't allow pyramid higher than 4 for your permissions :/`;
				}
							// cooldown
				if (cd.has(user['user-id'])) {
					return '';
				}
				cd.add(user['user-id']);
				setTimeout(() => {
					cd.delete(user['user-id']);
				}, 120000);
			}

			if (patternChosen[0].pattern === 'pyramid') {
				function createPyramid(height) {
					for (var i = 1; i <= height; i++) {
						var row = '';

						for (var j = 1; j <= i; j++)
							row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
						bot.kb.say(channel, row);
					}
					for (var i = height - 1; i > 0; i--) {
						var row = '';

						for (var j = i; j > 0; j--)
							row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
						bot.kb.say(channel, row);
					}
				}
				createPyramid(msgP[0]);
				return "";
			} else if (patternChosen[0].pattern === 'triangle') {
				const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

				function createTriangle(height) {
					for (var i = 1; i <= height; i++) {
						bot.kb.say(channel, (' ' + randomE + ' ').repeat(i))
					}
				}
				createTriangle(msgP[0]);
				return '';
			} else {
				return `${user['username']}, currently supporting only pyramid/triangle.`;
			}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err}  FeelsDankMan !!!`;
		}
	}
}