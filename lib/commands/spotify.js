#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const creds = require('../credentials/config.js');
const got = require('got');
const prefix = "kb ";

module.exports = {
    name: prefix + 'spotify',
    aliases: prefix + 'spotify',
    description: `kb spotify [start/pause/volume/skip/shuffle]`,
    permission: 0,
    cooldown: 5000,
    invocation: async (channel, user, message, args) => {
        try {
            const users = [
                "178087241", // kunszg
                "434454128", // sin____cere
                '194267009' // aii__
            ];

            const permittedUsers = users.filter(i => i === user['user-id']);

            if (!permittedUsers.length) {
                if (channel === '#forsen') {
                    return `${user['username']}, currently this command is disabled for non-permitted users, to get access to it follow the instructions on kunszg(dot)xyz/spotify.`;
                }
                return `${user['username']}, currently this command is disabled for non-permitted users, to get access to it follow the instructions on https://kunszg.xyz/spotify.`;
            }

            const refreshToken = await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify" AND user="${user['user-id']}"
                    `);

            const apiCall = async(link, method) => {
                const song = await got(link, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${refreshToken[0].access_token}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                }).json()

                if (!song) {
                    return '';
                }

                return song;
            }

            const msg = (message.split(' ')[1] === "spotify") ? custom.getParam(message.toLowerCase()) : custom.getParam(message.toLowerCase(), 1);

            const premUsers = [
                '194267009', // aii__
                '434454128' // sin____cere
            ];

            const premiumUsers = premUsers.filter(i => i === user['user-id']);

            if (msg[0] === "start") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/play', 'PUT');
                return `${user['username']}, current song has been resumed.`;
            }

            if (msg[0] === "pause" || msg[0] === "stop") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/pause', 'PUT');
                return `${user['username']}, song has been stopped.`;
            }

            if (msg[0] === "volume" || msg[0] === "vol") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }

                if (!msg[1]) {
                    await apiCall('https://api.spotify.com/v1/me/player/volume?volume_percent=50', 'PUT');
                    return `${user['username']}, playback volume on your spotify has been set to 50% (default).`;
                }

                if (!custom.hasNumber(msg[1].replace('%', ''))) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                if (msg[1].replace('%', '') > 100 || msg[1].replace('%', '') < 0) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                await apiCall(`https://api.spotify.com/v1/me/player/volume?volume_percent=${msg[1].replace('%', '')}`, 'PUT');
                return `${user['username']}, playback volume on your spotify has been set to ${msg[1].replace('%', '')}%.`;
            }

            if (msg[0] === "skip") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/next', 'POST');
                return `${user['username']}, current song has been successfully skipped.`;
            }

            if (msg[0] === "shuffle" || msg[0] === "random") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }

                if (msg[1] === "true" || msg[1] === "on") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=true', 'PUT');
                    return `${user['username']}, your playback mode is now set to shuffle.`;
                }

                if (msg[1] === "false" || msg[1] === "off") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=false', 'PUT');
                    return `${user['username']}, your playback is not shuffled anymore.`;
                }

                return `${user['username']}, only parameters true/false (or on/off) are valid for trigger "shuffle"`;
            }

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
                return `Current song playing on ${user['username']}'s Spotify:
                ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
                [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
                ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}] link 👉 ${urlFormatted}`;
            }
            return `Current song playing on ${user['username']}'s Spotify:
            ${song.item.name} by ${song.item.artists[0].name}, ${song.is_playing ? '▶ ' : '⏸ '}
            [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/
            ${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}]
            ${youtube.results[0].link}`;

        } catch (err) {
           if (err) {
                console.log(err)
                return `${user['username']}, no song is currently playing on ${user['username']}'s spotify FeelsDankMan`;
           }
        }
    }
}
