#!/usr/bin/env node
'use strict';

const fs = require('fs');
const custom = require('../utils/functions.js');
const limit = new Set();

module.exports = {
	name: "kb joemama",
	invocation: async (channel, user, message, platform) => {
		try {
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
			 	WHERE channel="${channel.replace('#', '')}"
			 	ORDER BY RAND()
			 	LIMIT 1
			 	`);

			// check for . or ! at the end of string
			const patt = /[.|!]$/g;
			const response = patt.test(jokeDataRaw) ? jokeDataRaw.slice(0,-1) : jokeDataRaw;

            if (channel === "#forsen") {
                return `${user['username']}, ${custom.lCase(response)} YOURMOM`;
            }

            if (platform === "whisper") {
                return `${custom.lCase(response)}}`;
            }
			return `${user['username']}, ${custom.lCase(response)} ${randomEmote.length ? randomEmote[0].emote : 'LUL'}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}