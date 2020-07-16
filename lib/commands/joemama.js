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

			return `${user['username']}, ${custom.lCase(response)} ${(randomEmote.length === 0) ? 'LUL' : randomEmote[0].emote}`
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}