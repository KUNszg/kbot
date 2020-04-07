#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "eval",
	aliases: null,
	description: `debugging command, permitted users only -- cooldown 10ms`,
	permission: 5,
	cooldown: 10,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2);

			const count = require('mathjs');
			const pi = require('pi-number');
			const shell = require('child_process');

			const rUni = require('random-unicodes');
			const rU = eval('"' + rUni({
				min: 0,
				max: 1114109
			}).replace('u', 'u{') + '}"');

			if (await custom.checkPermissions(user['username'])<5) { 
				return '';
			}

			if (msg.join(" ").toLowerCase() === "return typeof supinic") {
				return "hackerman"
			}

			if (msg.join(" ").toLowerCase().includes("creds")) {
				return user['username'] + ', api key :/'
			}

			function sleep(milliseconds) {
				var start = new Date().getTime();
				for (var i = 0; i < 1e7; i++) {
					if ((new Date().getTime() - start) > milliseconds) {
						break;
					}
				}
			}

			const ev = await eval('(async () => {' +msg.join(" ") + '})()');
			console.log(ev)
			return String(ev);

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}