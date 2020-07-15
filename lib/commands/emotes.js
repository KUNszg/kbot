#!/usr/bin/env node
'use strict';

const got = require('got');
const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const prefix = "kb ";

module.exports = {
	name: prefix + "emotes",
	aliases: null,
	description: `displays latest emotes added in the channel -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2);

			if (msg[0] === "yoink" && await custom.checkPermissions(user['username'])>1) {
				const channelParsed = channel.replace('#', '')

				const emotes = await custom.doQuery(`
				 	SELECT *
				 	FROM emotes
				 	WHERE channel="${channelParsed}"
				 	`);

				// get BTTV emotes from current channel
				let channelBTTVEmotes = await got(`https://decapi.me/bttv/emotes/${channelParsed}`);

				// get FFZ emotes form current channel
				let channelFFZEmotes = await got(`https://decapi.me/ffz/emotes/${channelParsed}`);

				channelBTTVEmotes = String(channelBTTVEmotes.body).split(' ');
				channelFFZEmotes = String(channelFFZEmotes.body).split(' ');
				
                           kb.say(channel, `${user['username']}, done TriHard`);

	                  if (channelBTTVEmotes.includes("Unable to") || channelFFZEmotes.includes("Unable to")) {
					return '';
				}

				const checkForRepeatedEmotes = (emote, type) => {
					const updateEmotes = emotes.find(i => i.emote === emote);
					if (!updateEmotes) {
						custom.doQuery(`
							INSERT INTO emotes (channel, emote, date, type)
							VALUES ("${channelParsed}", "${emote}", CURRENT_TIMESTAMP, "${type}")
							`);
					}	
				}
				
				channelBTTVEmotes.map(i => checkForRepeatedEmotes(i, 'bttv'));
				channelFFZEmotes.map(i => checkForRepeatedEmotes(i, 'ffz'));

				const allEmotes = channelBTTVEmotes.concat(channelFFZEmotes);
				const checkIfStillExists = emotes.filter(i => !allEmotes.includes(i.emote));

				if (checkIfStillExists.length === 0) {
					return '';
				}

				for (let i=0; i<checkIfStillExists.length; i++) {
					await custom.doQuery(`
						DELETE FROM emotes
						WHERE channel="${channelParsed}" AND emote="${checkIfStillExists[i].emote}"
						`);
				}
			}

			const latestEmotes = await custom.doQuery(`
				SELECT * 
				FROM emotes
				WHERE channel="${channel.replace('#', '')}"
				ORDER BY date
				DESC
				`);

			const emotes = latestEmotes.map(i => `${i.emote} (${((Date.now() - Date.parse(i.date)) > 172800000) ? Math.abs(Date.now() - Date.parse(i.date)/86400000)+'d ago' : custom.formatUptime(Date.now()/1000 - Date.parse(i.date)/1000)+' ago'})`).slice(0, 6);
			
			return `${user['username']}, recently added emotes: ${emotes.join(', ')}`
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
