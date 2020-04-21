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

			const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(2);
			const emote = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
			const msgP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(4);
			const emoteP = message.replace(/[\u{E0000}|\u{206d}]/gu, "").split(" ").splice(5);
		
			const patterns = [
				{ pattern: 'pyramid' },
				{ pattern: 'square' },
				{ pattern: 'circle' },
				{ pattern: 'triangle' }
			];
			const patternChosen = patterns.filter(
				i => i.pattern === msg[1]
			);

			const cases = [
				{ case: 'slow' },
				{ case: 'fast' }
			];
			const caseChosen = cases.filter(
				i => i.case === msg[0]
			);

			if (!msg[0]) {
				return `${user['username']}, no parameters provided (fast, slow) [err#1]`;
			} 
			if (!caseChosen[0] || msg[0] != caseChosen[0].case) {
				return `${user['username']}, invalid first parameter (fast, slow) [err#2]`;
			} 
			if (!patternChosen[0] || msg[1] != patternChosen[0].pattern) {
				return `${user['username']}, invalid second parameter 
				(${patterns.map(i => i.pattern).join(', ')}) [err#3]`;
			} 
			if (!msg[2] || !custom.hasNumber(msg[2])) {
				return `${user['username']}, invalid third parameter (number) [err#4]`;
			} 
			if (!emote[0] || !emote.join(' ').match(/[a-z]/i)) {
				return `${user['username']}, invalid fourth parameter (word) [err#5]`;
			} 

			if (await custom.checkPermissions(user['username'])<2) { 
				return '';
			}

			const checkChannelStatus = await custom.doQuery(`
				SELECT * 
				FROM channels 
				WHERE channel="${channel.replace('#', '')}"
				`);
			if (checkChannelStatus[0].status === "live") {
				return;
			}

			if (user['user-id'] != '178087241') {
				if (msg[2]>10 && await custom.checkPermissions(user['username'])>=3) {
					return `${user['username']}, I can't allow pyramids higher than 15 for your permissions 😬`;
				}

				if (msg[2]>5 && await custom.checkPermissions(user['username'])==2) {
					return `${user['username']}, I can't allow pyramid higher than 5 for your permissions :/`;
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

			function sleep(milliseconds) {
				var start = new Date().getTime();
				for (var i = 0; i < 1e7; i++) {
					if ((new Date().getTime() - start) > milliseconds) {
						break;
					}
				}
			}

			if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'pyramid') {
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
			} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'pyramid') {
				function createPyramid(height) {
					for (var i = 1; i <= height; i++) {
						var row = '';

						for (var j = 1; j <= i; j++)
							row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
						bot.kb.say(channel, row);
						sleep(1300);
					}
					for (var i = height - 1; i > 0; i--) {
						var row = '';

						for (var j = i; j > 0; j--)
							row += " " + emoteP[Math.floor(Math.random() * emoteP.length)];
						bot.kb.say(channel, row);
						sleep(1300);
					}
				}
				createPyramid(msgP[0]);
				return "";
			} else if (caseChosen[0].case === 'fast' && patternChosen[0].pattern === 'triangle') {
				const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

				function createTriangle(height) {
					for (var i = 1; i <= height; i++) {
						bot.kb.say(channel, (' ' + randomE + ' ').repeat(i))
					}
				}
				createTriangle(msgP[0]);
				return '';
			} else if (caseChosen[0].case === 'slow' && patternChosen[0].pattern === 'triangle') {
				const randomE = emoteP[Math.floor(Math.random() * emoteP.length)];

				function createTriangle(height) {
					for (var i = 1; i <= height; i++) {
						bot.kb.say(channel, (' ' + randomE + ' ').repeat(i))
						sleep(1300);
					}
				}
				createTriangle(msgP[0]);
				return '';
			} else if (patternChosen[0].pattern != 'pyramid' && 
				patternChosen[0].pattern != 'triangle') {
					return `${user['username']}, currently supporting only pyramid/triangle.`;
				}
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err}  FeelsDankMan !!!`;
		}
	}
}