#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "rt",
	aliases: null,
	description: `syntax: kb rt [ID] | no parameter - returns a link to the list of genres |
	ID - search for the song in the specified genre (numeric ID) -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			const options = {
				api_key: creds.randomTrack,
				genre: msg[0], //21, 1134, 1147
				snippet: false,
				language: 'en'
			};

			const rndSong = require('rnd-song');
			const songData = await new Promise((resolve, reject) => {
				rndSong(options, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});

			const search = require("youtube-search");
			const random = await search(songData.track.track_name + " by " + songData.track.artist_name, {
				maxResults: 1,
				key: creds.youtube
			});

			if (!msg) {
				return `${user['username']}, list of genres (type in the genre identifier like eg.: 
				kbot rt 15) https://pastebin.com/p5XvHkzn`;
			}

			if (channel != '#supinic') {
				return `${user['username']}, ${songData.track.track_name} by ${songData.track.artist_name}, 
				${random.results[0].link}`;
			} 

			if (channel === '#supinic') {
				return `$sr ${random.results[0].link}`;
			}

		} catch (err) {
			custom.errorLog(err)
			return user['username'] + ", " + err + " FeelsDankMan ❗";
		}
	}
}