#!/usr/bin/env node
'use strict';

const fs = require('fs');
const got = require('got');
const custom = require('../utils/functions.js');
const limit = new Set();
const kb = require('../handler.js').kb;
const prefix = "kb ";

module.exports = {
	name: prefix + "joemama",
	aliases: null,
	description: `random "your mom" joke -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const channelParsed = channel.replace('#', '');

			// get data from file
			let jokeDataRaw = fs.readFileSync('./data/mom_jokes.json');

			// convert received buffer to human-readable
			jokeDataRaw = JSON.parse(jokeDataRaw).data;

			// get a random joke
			jokeDataRaw = custom.random(jokeDataRaw)

			// get a random emote from database
			const randomEmote = await custom.doQuery(`
			 	SELECT *
			 	FROM emotes
			 	WHERE channel="${channelParsed}"
			 	ORDER BY RAND()
			 	LIMIT 1
			 	`);

			// check for . or ! at the end of string
			const patt = /[.|!]$/g;
			const response = patt.test(jokeDataRaw) ? jokeDataRaw.slice(0,-1) : jokeDataRaw;

			// response
			kb.say(channel, `${user['username']}, ${custom.lCase(response)} ${(randomEmote.length === 0) ? 'LUL' : randomEmote[0].emote}`);

			// cooldown on updating emotes in db
			if (limit.has(`busy_${channel}`)) {
				return '';
			} 
			limit.add(`busy_${channel}`);	
						
			setTimeout(() => {
				limit.delete(`busy_${channel}`);
			}, 1200000);
			
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
			
			return '';
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}