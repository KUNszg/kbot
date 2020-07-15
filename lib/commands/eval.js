#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js')

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

			const cache = [];
			const cacheinit = ['hi'];
			if (user['username'] === "kunszg" && msg.join(' ') === 'return "start"') {

				async function second() {

					if (cacheinit.length != 0) {
						cache.push('hello')
						cacheinit.length = 0;
					}
					if (cache.length === 0) {
						cache.push('ok');
					}
					const secondLoop = await fetch(`${creds.chat}${await cache[0].replace(/'/g, '').split(' ').join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
						.then(response => response.json());
					cache.length = 0;
					await kb.kb.say('kunszg', 'Bot 1: ' + await secondLoop.response.toString());
					if (secondLoop.response === ' ') {
						await cache.push(await secondLoop.response.replace(/\?/g, '').replace(' ', 'no'));
					} else {
						await cache.push(await secondLoop.response.replace(/\?/g, ''));
					}

					const firstLoop = await fetch(`${creds.chat}${cache[0].replace(/'/g, '').split(' ').join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
						.then(response => response.json());
					cache.length = 0;
					await kb.kb.say('kunszg', 'Bot 2: ' + await firstLoop.response.toString());
					if (firstLoop.response === ' ') {
						await cache.push(await firstLoop.response.replace(/\?/g, '').replace(' ', 'no'));
					} else {
						await cache.push(await firstLoop.response.replace(/\?/g, ''));
					}
				}
				setInterval(()=>{second()}, 15000);

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