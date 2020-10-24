#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js');
const kb = require('../handler.js').kb;
const got = require('got');

module.exports = {
	name: "kb rt",
	invocation: async (channel, user, message, platform) => {
		try {
			const msg = custom.getParam(message);

            let genres = require('../../data/genres.json');

			if (!msg) {
                if (platform === "whisper") {
                    return "list of genres with command examples: https://kunszg.xyz/genres";
                }
                if (channel === '#forsen') {
                    kb.whisper(user['username'], `, list of genres with command examples: https://kunszg.xyz/genres`);
                    return `${user['username']}, I whispered you response :)`;
                }
				return `${user['username']}, list of genres with command examples: https://kunszg.xyz/genres`;
			}

            const checkIfDecimal = new RegExp('^[0-9]+$');

            if (checkIfDecimal.test(msg[0])) {
                // find genre by value
                const getKeyByValue = Object.keys(genres).find(key => genres[key] === Number(msg[0]));
                if (typeof getKeyByValue === 'undefined') {
                    return `${user['username']}, specified genre number does not exist, list of genres: https://kunszg.xyz/genres`;
                }
                genres = Number(msg[0]);
            } else {
                // find genre by key
                const getKeyByName = Object.keys(genres).filter(i => i.toLowerCase() === msg.join(' ').toLowerCase());
                if (!getKeyByName.length) {
                    return `${user['username']}, specified genre name does not exist, list of genres: https://kunszg.xyz/genres`;
                }
                genres = Object.entries(genres).filter(i => i[0].toLowerCase() === msg.join(' ').toLowerCase())[0][1];
            }

            let songData;

            const track = await got(`https://api.musixmatch.com/ws/1.1/track.search?format=json&apikey=${creds.randomTrack}&s_track_rating=desc&f_music_genre_id=${genres}&page_size=1`).json();
            if (track.message.header.available > 0) {
                const pages = Math.ceil(track.message.header.available / 100);
                const page = Math.floor((Math.random() * pages) + 1);
                const randomTrack = await got(`https://api.musixmatch.com/ws/1.1/track.search?format=json&apikey=${creds.randomTrack}&s_track_rating=desc&f_music_genre_id=${genres}&page_size=100&page=${page}`).json();
                const tracks = randomTrack.message.body.track_list;
                if (tracks.length > 0) {
                    const rnd = Math.floor((Math.random() * tracks.length));
                    songData = tracks[rnd];
                } else {
                    throw 'no tracks found for given genre ID FeelsDankMan';
                }
            } else {
                throw 'no tracks found for given genre ID FeelsDankMan';
            }

			const random = await custom.youtube(`${songData.track.track_name} by ${songData.track.artist_name}`, 1);

            if (!random.results.length) {
                return `${user['username']}, no youtube results were found for song ${songData.track.track_name} by
                ${songData.track.artist_name}, therefore I can't provide you with direct link :(`;
            }

            if (platform === "whisper") {
                return `${songData.track.track_name} by
                ${songData.track.artist_name}, ${random.results[0].link}`;
            }
			if (channel === '#supinic') {
                return `$sr ${random.results[0].link}`;
			}
            if (channel === '#forsen') {
                kb.whisper(user['username'], `${songData.track.track_name} by
                    ${songData.track.artist_name}, ${random.results[0].link}`);
                return `${user['username']}, I whispered you response :)`;
            }
			return `${user['username']}, ${songData.track.track_name} by
            ${songData.track.artist_name}, ${random.results[0].link}`;
		} catch (err) {
			custom.errorLog(err);
			return `${user['username']}, ${err} FeelsDankMan ❗`;
		}
	}
}