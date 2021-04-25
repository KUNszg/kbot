#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const cd = new Set();

module.exports = {
	name: "kb pattern",
	invocation: async (channel, user, message, platform) => {
		try {
            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

			const msg = utils.getParam(message, 2);
			const msgP = utils.getParam(message, 3);
			const emote = utils.getParam(message, 4);

			const patterns = [
				{ pattern: 'pyramid' },
				{ pattern: 'square' },
				{ pattern: 'inverse' },
				{ pattern: 'triangle' }
			];
			const patternChosen = patterns.filter(
				i => i.pattern === msg[0]
			);

            const perms = await utils.checkPermissions(user['username'])

		    if (user['username'] != channel.replace('#', '')) {
			    if (perms < 2) {
                    return '';
                }
			}

			const checkChannelStatus = await utils.query(`
				SELECT *
				FROM channels
				WHERE channel=?`,
                [channel.replace('#', '')]);
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

			if (!msg[1] || !utils.hasNumber(msg[1])) {
				return `${user['username']}, invalid second parameter (number) [err#4]`;
			}

			if (msg[1] < 2) {
				return `${user['username']}, cannot build a pyramid smaller than 2 FeelsDankMan`;
			}

			if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
				return `${user['username']}, invalid third parameter (word) [err#5]`;
			}

			if (user['user-id'] != '178087241') {
                if (msg[1] > 25 && user['username'] === channel.replace('#', '')) {
                    return `${user['username']}, can't do patterns bigger than 25.`;
                }

				if (msg[1] > 15 && Number(perms) === 4) {
                    return `${user['username']}, I can't allow pyramid higher than 15 for your permissions :/`;
                }

                if (msg[1] > 7 && Number(perms) === 3) {
                    return `${user['username']}, I can't allow pyramid higher than 7 for your permissions :/`;
                }

				if (msg[1] > 4 && Number(perms) === 2) {
					return `${user['username']}, I can't allow pyramid higher than 4 for your permissions :/`;
				}

                if (msg[1] > 3 && channel === "#nymn") {
                    return `${user['username']}, pyramids higher than 3 are not allowed in this channel FeelsDankMan`;
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
				const createPyramid = (height) => {
					for (var i = 1; i <= height; i++) {
						var row = '';

						for (var j = 1; j <= i; j++)
							row += " " + emote[Math.floor(Math.random() * emote.length)];
						kb.say(channel, row);
					}
					for (var i = height - 1; i > 0; i--) {
						var row = '';

						for (var j = i; j > 0; j--)
							row += " " + emote[Math.floor(Math.random() * emote.length)];
						kb.say(channel, row);
					}
				}
				createPyramid(msgP[0]);
				return "";
            }

			if (patternChosen[0].pattern === 'triangle') {
				const randomE = emote[Math.floor(Math.random() * emote.length)];

				const createTriangle = (height) => {
					for (var i = 1; i <= height; i++) {
						kb.say(channel, (' ' + randomE + ' ').repeat(i))
					}
				}
				createTriangle(msgP[0]);
				return '';
			}
            return `${user['username']}, currently supporting only pyramid/triangle.`;
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err}  FeelsDankMan !!!`;
		}
	}
}