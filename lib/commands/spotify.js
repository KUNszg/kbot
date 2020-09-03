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
    description: `song that currently plays on my spotify`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {
            const users = [
                "kunszg",
                "sin____cere"
            ];

            const permittedUsers = users.filter(i => i === user['username']);

            if (!permittedUsers.length) {
                return `${user['username']}, currently this command is disabled for not permitted users.`;
            }

            const refreshToken = (user['username'] === "kunszg") ?
                await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify" AND user="kunszg"
                    `) :
                await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify" AND user="sinris"
                    `);

            const apiCall = async(link, method) => {
                const song = (await fetch(link, {
                    method: method,
                    url: link,
                    headers: {
                        'Authorization': `Bearer ${refreshToken[0].access_token}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                }).then(response => response.json()));

                return song;
            }

            const msg = (message.split(' ')[1] === "spotify") ? custom.getParam(message.toLowerCase()) : custom.getParam(message.toLowerCase(), 1);

            if (!msg[0]) {
                const song = await apiCall('https://api.spotify.com/v1/me/player/currently-playing', 'GET');

                const search = require("youtube-search");
                const youtube = await search(`${song.item.name} by ${song.item.artists[0].name}`, {
                    maxResults: 1,
                    key: creds.youtube
                });

                const urlFormatted = youtube.results[0].link
                    .replace('https://', '')
                    .replace(/\./g, '(dot)')
                    .replace('(dot)', '.');

                const minutes = (input) => {
                    const minutes = String(Math.floor(input/1000/60));
                    if (minutes.split('').length===1) {
                        return `0${minutes}`;
                    }
                    return minutes;
                }

                const seconds = (input) => {
                    const seconds = String(Math.floor(input/1000 % 60));
                    if (seconds.split('').length===1) {
                        return `0${seconds}`;
                    }
                    return seconds;
                }

                if (channel === "#forsen") {
                    return `${user['username']}, current song playing on ${user['username']}'s spotify:
                    ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
                    [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
                    ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}] link 👉 ${urlFormatted}`;
                }
                return `${user['username']}, current song playing on ${user['username']}'s spotify:
                ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
                [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
                ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}]
                ${youtube.results[0].link}`;
            }

            if (msg[0] === "start") {
                if (user['username'] != "sin____cere") {
                    return `${user['username']}, only premium spotify users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/play', 'PUT');
                return `${user['username']}, current song has been resumed.`;
            }

            if (msg[0] === "pause" || msg[0] === "stop") {
                if (user['username'] != "sin____cere") {
                    return `${user['username']}, only premium spotify users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/pause', 'PUT');
                return `${user['username']}, song has been stopped.`;
            }

            if (msg[0] === "volume" || msg[0] === "vol") {
                if (user['username'] != "sin____cere") {
                    return `${user['username']}, only premium spotify users can use this parameter :(`;
                }

                if (!msg[1]) {
                    await apiCall('https://api.spotify.com/v1/me/player/volume?volume_percent=50', 'PUT');
                    return `${user['username']}, playback volume on your spotify has been set to 50% (default).`;
                }

                if (custom.hasNumber(msg[1].replace('%', ''))) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                if (msg[1].replace('%', '') > 100 || msg[1].replace('%', '') < 0) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                await apiCall(`https://api.spotify.com/v1/me/player/volume?volume_percent=${msg[1].replace('%', '')}`, 'PUT');
                return `${user['username']}, playback volume on your spotify has been set to ${msg[1].replace('%', '')}%.`;
            }
        } catch (err) {
           if (err) {
                console.log(err)
                return `${user['username']}, no song is currently playing on ${user['username']}'s spotify FeelsDankMan`;
           }
        }
    }
}
