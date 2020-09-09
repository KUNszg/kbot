#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: prefix + "rt",
	aliases: null,
	description: `syntax: kb rt [ID] | no parameter - returns a link to the list of genres |
	ID - search for the song in the specified genre (numeric ID)`,
	permission: 0,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

            let genres = require('../../data/genres.json');

            const checkIfDecimal = new RegExp('^[0-9]+$');

			if (!msg) {
                if (channel === '#forsen') {
                    kb.whisper(user['username'], `, list of genres (type in the genre identifier like eg.:
                        kbot rt <number>  OR kb rt <genre name>) https://pastebin.com/p5XvHkzn`);
                    return `${user['username']}, I whispered you response :)`;
                }
				return `${user['username']}, list of genres (type in the genre identifier like eg.:
                    kbot rt <number>  OR kb rt <genre name>) https://pastebin.com/p5XvHkzn`;
			}

            if (checkIfDecimal.test(msg[0])) {
                // find genre by value
                const getKeyByValue = Object.keys(genres).find(key => genres[key] === Number(msg[0]));
                if (typeof getKeyByValue === 'undefined') {
                    return `${user['username']}, specified genre number does not exist, list of genres: https://pastebin.com/p5XvHkzn`;
                }
                genres = Number(msg[0]);
            }
            else {
                // find genre by key
                const getKeyByName = Object.keys(genres).filter(i => i.toLowerCase() === msg.join(' ').toLowerCase());
                if (!getKeyByName.length) {
                    return `${user['username']}, specified genre name does not exist, list of genres: https://pastebin.com/p5XvHkzn`;
                }
                genres = Object.entries(genres).filter(i => i[0].toLowerCase() === msg.join(' ').toLowerCase())[0][1];
            }

			const options = {
				api_key: creds.randomTrack,
				genre: genres,
				snippet: false,
				language: 'en'
			};

			const rndSong = require('rnd-song');
			const songData = await new Promise((resolve, reject) => {
				rndSong(options, (err, res) => {
					if (err) {
						reject(err);
					}
                    else {
						resolve(res);
					}
				});
			});

			const random = await custom.youtube(`${songData.track.track_name} by ${songData.track.artist_name}`, 1);

            if (!random.results.length) {
                return `${user['username']}, no youtube results were found for song ${songData.track.track_name} by
                        ${songData.track.artist_name}, therefore I can't provide you with direct link :(`;
            }

			if (channel != '#supinic') {
                if (channel === '#forsen') {
                    kb.whisper(user['username'], `${songData.track.track_name} by
                        ${songData.track.artist_name}, ${random.results[0].link}`);
                    return `${user['username']}, I whispered you response :)`;
                }
				return `${user['username']}, ${songData.track.track_name} by
                ${songData.track.artist_name}, ${random.results[0].link}`;
			}
			return `$sr ${random.results[0].link}`;
		} catch (err) {
			custom.errorLog(err);
			return `${user['username']}, ${err} FeelsDankMan ❗`;
		}
	}
}