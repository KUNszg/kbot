#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js');
const got = require('got');

module.exports = {
    name: 'kb spotify',
    invocation: async (channel, user, message, args) => {
        try {
        const msg = (message.split(' ')[1] === "spotify") ?
            custom.getParam(message.toLowerCase()) :
            custom.getParam(message.toLowerCase(), 1);

            const userList = await custom.doQuery(`
                SELECT *
                FROM access_token
                WHERE platform="spotify"
                `);

            const users = userList.map(i => i.user)

            const permittedUsers = users.filter(i => i === user['user-id']);

            if (!permittedUsers.length) {
                if (channel === '#forsen') {
                    return `${user['username']}, To get access to this command, follow the login process on kunszg(dot)xyz/spotify`;
                }
                return `${user['username']}, To get access to this command, follow the login process on https://kunszg.xyz/spotify`;
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
                }).json();

                if (!song) {
                    return '';
                }
                return song;
            }

            const premUsers = userList.filter(i => i.premium === "Y").map(i => i.user)
            const premiumUsers = premUsers.filter(i => i === user['user-id']);

            const song = await apiCall('https://api.spotify.com/v1/me/player/currently-playing', 'GET');

            if (msg[0] === "start") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/play', 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been resumed.');
                    return '';
                }
                return `${user['username']}, current song has been resumed.`;
            }

            if (msg[0] === "pause" || msg[0] === "stop") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/pause', 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been stopped.');
                    return '';
                }
                return `${user['username']}, current song has been stopped.`;
            }

            if (msg[0] === "volume" || msg[0] === "vol") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                if (!msg[1]) {
                    await apiCall('https://api.spotify.com/v1/me/player/volume?volume_percent=50', 'PUT');
                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Playback volume on your spotify has been set to 50% (default).');
                        return '';
                    }
                    return `${user['username']}, playback volume on your spotify has been set to 50% (default).`;
                }

                if (!custom.hasNumber(msg[1].replace('%', ''))) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                if (msg[1].replace('%', '') > 100 || msg[1].replace('%', '') < 0) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                await apiCall(`https://api.spotify.com/v1/me/player/volume?volume_percent=${msg[1].replace('%', '')}`, 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], `Playback volume on your spotify has been set to ${msg[1].replace('%', '')}%.`);
                    return '';
                }
                return `${user['username']}, playback volume on your spotify has been set to ${msg[1].replace('%', '')}%.`;
            }

            if (msg[0] === "skip") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/next', 'POST');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been successfully skipped.');
                    return '';
                }
                return `${user['username']}, current song has been successfully skipped.`;
            }

            if (msg[0] === "shuffle" || msg[0] === "random") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                if (msg[1] === "true" || msg[1] === "on") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=true', 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Your playback mode is now set to shuffle.');
                        return '';
                    }
                    return `${user['username']}, your playback mode is now set to shuffle.`;
                }

                if (msg[1] === "false" || msg[1] === "off") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=false', 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Your playback is not shuffled anymore.');
                        return '';
                    }
                    return `${user['username']}, your playback is not shuffled anymore.`;
                }
                return `${user['username']}, only parameters true/false (or on/off) are valid for trigger "shuffle"`;
            }

            if (msg[0] === "repeat") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only premium users can use this parameter :(`;
                }
                if (!song?.item ?? false) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                if (msg[1] === "track") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=track', 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Repeat mode on your spotify is now set to repeat current track.');
                        return '';
                    }
                    return `${user['username']}, repeat mode on your spotify is now set to repeat current track.`;
                }

                if (msg[1] === "context") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=context', 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Repeat mode on your spotify is now set to repeat current context.');
                        return '';
                    }
                    return `${user['username']}, repeat mode on your spotify is now set to repeat current context.`;
                }

                if (msg[1] === "off" || msg[1] === "false") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=off', 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Repeat mode on your Spotify is now turned off.');
                        return '';
                    }
                    return `${user['username']}, repeat mode on your Spotify is now turned off.`;
                }

                return `${user['username']}, only parameters track/context/off are valid for trigger "repeat".`;
            }

            if (msg[0] === "allow") {
                await custom.doQuery(`
                    UPDATE access_token
                    SET allowLookup="Y"
                    WHERE user="${user['user-id']}"
                    `);
                return `${user['username']}, you allowed other registered users to lookup your playing songs.`;
            }

            if (msg[0] === "disallow") {
                await custom.doQuery(`
                    UPDATE access_token
                    SET allowLookup="N"
                    WHERE user="${user['user-id']}"
                    `);
                return `${user['username']}, other users won't be able to view your currently playing song anymore.`;
            }


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

            // checks if output message is not too long
            class ModifyOutput {
                constructor(input) {
                    this.input = input;
                }

                trimmer() {
                    return (this.input.length > 30) ? `${this.input.substr(0, 30)}(...)` : this.input;
                }
            }

            if (msg[0]) {
                if (msg[0].startsWith('@')) {
                    const findUser = await custom.doQuery(`
                        SELECT *
                        FROM user_list
                        WHERE username="${msg[0].replace('@', '').replace(',', '').toLowerCase()}"
                        `);

                    if (!findUser.length) {
                        return `${user['username']}, this user does not exist in my logs.`;
                    }

                    const isRegistered = await custom.doQuery(`
                        SELECT *
                        FROM access_token
                        WHERE user="${findUser[0].userId}"
                        `);

                    if (!isRegistered.length) {
                        return `${user['username']}, this user is not registered for this command.`;
                    }

                    if (isRegistered[0].allowLookup === "N") {
                        return `${user['username']}, this user's settings do not allow for a song lookup.`;
                    }

                    const usersSong = await got('https://api.spotify.com/v1/me/player/currently-playing', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${isRegistered[0].access_token}`,
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                    }).json();

                    if (!usersSong) {
                        return `${user['username']}, there is no song playing on ${findUser[0].username}'s Spotify.`;
                    }

                    const artist = new ModifyOutput(usersSong.item.artists[0].name);
                    const songTitle = new ModifyOutput(usersSong.item.name);

                    const response = `Current song playing on ${findUser[0].username}'s Spotify:
                    ${songTitle.trimmer()} by ${artist.trimmer()}, ${usersSong.is_playing ? '▶ ' : '⏸ '}
                    [${minutes(usersSong.progress_ms)}:${seconds(usersSong.progress_ms)}/${minutes(usersSong.item.duration_ms)}:${seconds(usersSong.item.duration_ms)}] `;

                    try {
                        const youtubeUser = await custom.youtube(`${usersSong.item.name} by ${usersSong.item.artists[0].name}`, 1);

                        if (channel === "#forsen") {
                            return response;
                        }

                        return response + youtubeUser.results[0].link;
                    } catch (err) {
                        if ((err.response?.status ?? true) && (Number(err.response.status) === 403)) {
                            return response + '[ran out of youtube queries]';;
                        }
                        if (msg[0]) {
                            if (msg[0].startsWith('@')) {
                                return `${user['username']}, there is no song playing on ${msg[0]}'s Spotify.`;
                            }
                        }
                        console.log(err);
                    }
                }
            }
            const artist = new ModifyOutput(song.item.artists[0].name);
            const songTitle = new ModifyOutput(song.item.name);

            const response = `Current song playing on ${user['username']}'s Spotify:
            ${songTitle.trimmer()} by ${artist.trimmer()}, ${song.is_playing ? '▶ ' : '⏸ '}
            [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}] `;

            try {
                const youtube = await custom.youtube(`${song.item.name} by ${song.item.artists[0].name}`, 1);

                if (channel === "#forsen") {
                    return response;
                }
                return response + youtube.results[0].link;
            } catch (err) {
                if ((err.response?.status ?? true) && Number(err.response.status) === 403) {
                    return response + '[ran out of youtube queries]';
                }
                console.log(err);
                return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
            }
        } catch (err) {
            console.log(err);
            if ((err.response?.status ?? true) && err.name === "HTTPError") {
                return `${user['username']}, 404 error has occured, Spotify web service is most likely down FeelsDankMan`;
            }
            return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
        }
    }
}
