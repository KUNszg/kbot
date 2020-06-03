#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const creds = require('../credentials/config.js');
const fetch = require('node-fetch');
const prefix = "kb ";

module.exports = {
    name: prefix + 'spotify',
    aliases: prefix + 'spotify',
    description: `song that currently plays on my spotify -- cooldown 5s`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {

            const refreshToken = await custom.doQuery(`
                SELECT *
                FROM access_token
                WHERE platform="spotify"
                `);

            const song = (await fetch(`https://api.spotify.com/v1/me/player/currently-playing`, {
                method: "GET",
                url: `https://api.spotify.com/v1/me/player/currently-playing`,
                headers: {
                    'Authorization': `Bearer ${refreshToken[0].access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).then(response => response.json()))

            function minutes() {
                const minutes = String(Math.floor(song.progress_ms/1000/60));
                if (minutes.split('').length===1) {
                    return 0+minutes
                }
                return minutes
            }

            function seconds() {
                const seconds = String(Math.floor(song.progress_ms/1000 % 60));
                if (seconds.split('').length===1) {
                    return 0+seconds
                }
                return seconds
            }

            if (channel === "#forsen") {
                return `${user['username']}, current song playing on my spotify: ${song.item.name} by ${song.item.artists[0].name},
                timestamp at ${minutes()}:${seconds()} (${song.is_playing ? 'playing' : 'paused'}) ${song.item.external_urls.spotify.replace('https://', '').replace(/\./g, ' (dot) ').replace(' (dot) ', '.')}`;
            }
            return `${user['username']}, current song playing on my spotify: ${song.item.name} by ${song.item.artists[0].name},
            timestamp at ${minutes()}:${seconds()} (${song.is_playing ? 'playing' : 'paused'}) ${song.item.external_urls.spotify}`;

        } catch (err) {
           if (err) {
                console.log(err);
                return `${user['username']}, no song is currently playing on my spotify FeelsDankMan`;
           }
        }
    }
}
