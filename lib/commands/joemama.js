#!/usr/bin/env node
'use strict';

const fs = require('fs');
const got = require('got');
const custom = require('../utils/functions.js');
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

			// get BTTV emotes from current channel
			let channelBTTVEmotes = await got(`https://decapi.me/bttv/emotes/${channel.replace('#', '')}`);

			// get FFZ emotes form current channel
			let channelFFZEmotes = await got(`https://decapi.me/ffz/emotes/${channel.replace('#', '')}`);

			/*	
			 * 	TODO: keep emotes in database for each channel
			 */

			// convert received buffer to human-readable
			jokeDataRaw = JSON.parse(jokeDataRaw).data;
			channelBTTVEmotes = String(channelBTTVEmotes.body).split(' ');
			channelFFZEmotes = String(channelFFZEmotes.body).split(' ');

			const channelEmotes = channelBTTVEmotes.concat(channelFFZEmotes);

			// get a random element
			jokeDataRaw = custom.random(jokeDataRaw)
			const randomEmote = custom.random(channelEmotes)

			// check for . or ! at the end of string
			const patt = /[.|!]$/g;
			const response = patt.test(jokeDataRaw) ? jokeDataRaw.slice(0,-1) : jokeDataRaw;

			return `${user['username']}, ${custom.lCase(response)} ${randomEmote}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}