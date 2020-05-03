#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

module.exports = {
	name: prefix + "rp",
	aliases: null,
	description: `interaction command with Supibot's $ps command, 
	sends a random playsound to appear on stream -- cooldown 5s`,
	permission: 5,
	cooldown: 10000,
	invocation: async (channel, user, message, args) => {
		try {

			const input = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.toLowerCase()
				.split(' ')
				.splice(2)
				.filter(Boolean);

			const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
				.then(response => response.json());

			const randomPs = playsound.data.playsounds[
				Math.floor(Math.random()*playsound.data.playsounds.length)
				]

			if (channel === "#supinic") {
				if (input[0] === 'update' && (await custom.checkPermissions(user['username'])>=2)) {

					playsound.data.playsounds.forEach(i=>
						custom.doQuery(`
							INSERT INTO playsounds (name, cooldown) 
							VALUES ("${i.name}", "${i.cooldown}")
							`)
						);
					return `${user['username']}, done :)`;
				}
				return `$ps ${randomPs.name}`;
			}

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}