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
			const msg = custom.getParam(message);

			Date.prototype.addSeconds= function(seconds) {
				var copiedDate = new Date(this.getTime());
				return new Date(copiedDate.getTime() + seconds * 1000);
			}
			const now = new Date();

			if (channel === "#supinic") {
				if (msg[0] === 'update' && (await custom.checkPermissions(user['username'])>=2)) {

					const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
						.then(response => response.json());

					playsound.data.playsounds.forEach(i=>
						custom.doQuery(`
							INSERT INTO playsounds (name, cooldown, last_executed) 
							VALUES ("${i.name}", "${i.cooldown}", "${new Date().toISOString().slice(0, 19).replace('T', ' ')}")
							`)
						);
					return `${user['username']}, done :)`;
				}
				const getPS = await custom.doQuery(`
					SELECT *
					FROM playsounds
					WHERE last_executed < NOW()
					GROUP BY RAND() 
					LIMIT 1
					`);

				await custom.doQuery(`
					UPDATE playsounds 
					SET last_executed="${now.addSeconds(getPS[0].cooldown/1000).toISOString().slice(0, 19).replace('T', ' ')}" 
					WHERE name="${getPS[0].name}"
					`);
				return `$ps ${getPS[0].name}`;
			}

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}