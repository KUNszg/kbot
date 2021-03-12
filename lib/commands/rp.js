#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got');

module.exports = {
	name: "kb rp",
	invocation: async (channel, user, message, platform) => {
		try {
            if (platform === "whisper") {
                return "This command is disabled on this platform";
            }

			const msg = custom.getParam(message);

			Date.prototype.addSeconds= function(seconds) {
				var copiedDate = new Date(this.getTime());
				return new Date(copiedDate.getTime() + seconds * 1000);
			}
			const now = new Date();

			if (channel === "#supinic") {
				if (msg[0] === 'update' && (await custom.checkPermissions(user['username'])>=2)) {

					const playsound = await got("https://supinic.com/api/bot/playsound/list").json()

					playsound.data.playsounds.forEach(i =>
						custom.query(`
							INSERT INTO playsounds (name, cooldown, last_executed)
							VALUES (?, ?, ?)`,
                            [i.name, i.cooldown, new Date().toISOString().slice(0, 19).replace('T', ' ')])
						);
					return `${user['username']}, done :)`;
				}
				const getPS = await custom.query(`
					SELECT *
					FROM playsounds
					WHERE last_executed < NOW()
					GROUP BY RAND()
					LIMIT 1`);

                const time = now.addSeconds(getPS[0].cooldown/1000).toISOString().slice(0, 19).replace('T', ' ');

				await custom.query(`
					UPDATE playsounds
					SET last_executed=?
					WHERE name=?`,
                    [time, getPS[0].name]);

				return `$ps ${getPS[0].name}`;
			}

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}