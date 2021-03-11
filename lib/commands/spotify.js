#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js');
const got = require('got');

module.exports = {
    name: 'kb spotify',
    invocation: async (channel, user, message) => {
        try {
            // get correct param depending on if message is an alias
            const msg = (message.split(' ')[1] === "spotify") ?
                custom.getParam(message.toLowerCase()) :
                custom.getParam(message.toLowerCase(), 1);

            // checks if output message is not too long
            class ModifyOutput {
                constructor(input, trim = 30) {
                    this.input = input;
                    this.trim = trim;
                }

                trimmer() {
                    const noPing = (str) => {
                        if (str.toLowerCase() === "constera" || str.toLowerCase() === "nymn") {
                            return str.replace(/^(.{2})/, "$1\u{E0000}");
                        }
                        return str
                    }

                    if (!Array.isArray(this.input)) {
                        return (this.input.length > this.trim) ?
                            `${noPing(this.input.substr(0, this.trim))}(...)` : noPing(this.input);
                    }

                    let result = [];

                    for (let i = 0; i < this.input.length; i++) {
                        result.push((this.input[i].length > this.trim) ?
                            `${noPing(this.input[i].substr(0, this.trim))}(...)` : noPing(this.input[i]));
                    }
                    return result;
                }
            }

            try {
                if (msg[0] === "music" || msg[0] === "lastfm") {
                    if (msg[1] === "unregister") {
                        const checkIfUserRegistered = await custom.doQuery(`
                            SELECT *
                            FROM access_token
                            WHERE platform="lastfm" AND user="${user['user-id']}"
                            `);
                        if (!checkIfUserRegistered.length) {
                            return `${user['username']}, you are not registered for this command.`;
                        }

                        await custom.doQuery(`
                            DELETE FROM access_token
                            WHERE user="${user['user-id']}" AND platform="lastfm"
                            `);

                        return `${user['username']}, you have been successfully unregistered fron Lastfm command.`;
                    }

                    const checkIfUserRegistered = await custom.doQuery(`
                        SELECT *
                        FROM access_token
                        WHERE platform="lastfm" AND user="${user['user-id']}"
                        `);
                    if (!checkIfUserRegistered.length) {
                        if (channel === '#forsen') {
                            return `${user['username']}, To get access to this command, follow the login process on kunszg(dot)com/connections`;
                        }
                        return `${user['username']}, To get access to this command, follow the login process on https://kunszg.com/connections`;
                    }

                    if (msg[1] === "allow") {
                        await custom.doQuery(`
                            UPDATE access_token
                            SET allowLookup="Y"
                            WHERE platform="lastfm" AND user="${user['user-id']}"
                            `);
                        return `${user['username']}, you allowed other registered users to lookup your playing songs.`;
                    }

                    if (msg[1] === "disallow") {
                        await custom.doQuery(`
                            UPDATE access_token
                            SET allowLookup="N"
                            WHERE platform="lastfm" AND user="${user['user-id']}"
                            `);
                        return `${user['username']}, other users won't be able to view your currently playing song anymore.`;
                    }

                    const lastfmCurrPlaying = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${checkIfUserRegistered[0].access_token}&api_key=${creds.lastfmApiKey}&format=json`).json();
                    const lastfm = lastfmCurrPlaying.recenttracks.track[0];

                    if (!lastfm?.['@attr']) {
                        return `${user['username']}, no song is playing on your LastFM FeelsDankMan`;
                    }

                    let [playing, artist] = new ModifyOutput([lastfm.name, lastfm.artist['#text']]).trimmer();

                    const response = `Current song playing on ${user['username']}'s LastFM: ${playing} by ${artist} `;

                    try {
                        if (channel === "#forsen") {
                            return response;
                        }

                        const youtube = await custom.youtube(`${lastfm.name} by ${lastfm.artist['#text']}`);
                        return response + youtube.url;
                    } catch (err) {
                        if (err.error?.code === 403) {
                            return response + ' [ran out of youtube queries]';
                        }
                        console.log(err);
                        return `${user['username']}, unexpected error FeelsDankMan`;
                    }
                }
            } catch (err) {
                console.log(err.response.statusCode);
                if (!err.response?.statusCode) {
                    return `${user['username']}, ${custom.status(err.response.statusCode)} FeelsDankMan`;
                }
            }

            const refresh = async(col, userRaw = user['user-id']) => {
                const username = userRaw.replace("@", "").replace(",", "")

                const refresh = await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify" AND user="${username}" OR username="${username}"
                    `);

                if (col === "access_token") {
                    return refresh[0].access_token;
                }
                if (col === "refresh_token") {
                    return refresh[0].refresh_token;
                }
            }

            const apiCall = async(link, userRaw, method = "GET") => {
                if (userRaw && userRaw != user['username']) {
                    const username = userRaw.replace("@", "").replace(",", "");
                    const checkIfRenewed = await custom.doQuery(`
                        SELECT *
                        FROM access_token
                        WHERE platform="spotify"
                            AND username="${username}"
                            AND lastRenew < NOW() - interval 58 MINUTE
                        `);

                    if (checkIfRenewed.length) {
                        try {
                            const tokenSpotify = await got(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${await refresh("refresh_token", username)}&client_secret=${creds.client_secret_spotify}&client_id=${creds.client_id_spotify}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                },
                            }).json();

                            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // convert to sql timestamp format

                            await custom.doQuery(`
                                UPDATE access_token
                                SET access_token="${tokenSpotify.access_token}",
                                    scopes="${tokenSpotify.scope}",
                                    lastRenew="${timestamp}"
                                WHERE platform="spotify" AND username="${username}"
                                `);

                            const checkPremium = await got(`https://api.spotify.com/v1/me`, {
                                method: "GET",
                                headers: {
                                    'Authorization': `Bearer ${await refresh("access_token", username)}`,
                                    "Content-Type": "application/x-www-form-urlencoded"
                                },
                            }).json();

                            await custom.doQuery(`
                                UPDATE access_token
                                SET premium="${(checkPremium.product === "open") ? "N" : "Y"}"
                                WHERE platform="spotify" AND username="${username}" AND user!="138403101"
                                `);
                        } catch (err) {
                            const error = JSON.parse(err.response.body);
                            if (error.error === "invalid_grant" && error.error_description === "Refresh token revoked") {
                                await custom.doQuery(`
                                    DELETE FROM access_token
                                    WHERE platform="spotify" AND user="${username}"
                                    `);
                                return '';
                            }
                            console.log(err);
                        }
                    }

                    const data = await got(encodeURI(link), {
                        method: method,
                        headers: {
                            'Authorization': `Bearer ${await refresh("access_token", username)}`,
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                    }).json();

                    if (!data) {
                        return '';
                    }
                    return data;
                }
                const checkIfRenewed = await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify"
                        AND user="${user['user-id']}"
                        AND lastRenew < NOW() - interval 58 MINUTE
                    `);

                if (checkIfRenewed.length) {
                    try {
                        const tokenSpotify = await got(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${await refresh("refresh_token")}&client_secret=${creds.client_secret_spotify}&client_id=${creds.client_id_spotify}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                        }).json();

                        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // convert to sql timestamp format

                        await custom.doQuery(`
                            UPDATE access_token
                            SET access_token="${tokenSpotify.access_token}",
                                scopes="${tokenSpotify.scope}",
                                lastRenew="${timestamp}"
                            WHERE platform="spotify" AND user="${user['user-id']}"
                            `);

                        const checkPremium = await got(`https://api.spotify.com/v1/me`, {
                            method: "GET",
                            headers: {
                                'Authorization': `Bearer ${await refresh("access_token")}`,
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                        }).json();

                        await custom.doQuery(`
                            UPDATE access_token
                            SET premium="${(checkPremium.product === "open") ? "N" : "Y"}",
                                username="${user['username']}"
                            WHERE platform="spotify" AND user="${user['user-id']}" AND user!="138403101"
                            `);
                    } catch (err) {
                        const error = JSON.parse(err.response.body);
                        if (error.error === "invalid_grant" && error.error_description === "Refresh token revoked") {
                            await custom.doQuery(`
                                DELETE FROM access_token
                                WHERE platform="spotify" AND user="${user['user-id']}"
                                `);
                            kb.say(channel, `${user['username']}, your Spotify token has been revoked, you will have to register for this command again to use it.`);
                            return '';
                        }
                        console.log(err);
                    }
                }

                const data = await got(encodeURI(link), {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${await refresh("access_token")}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                }).json();

                if (!data) {
                    return '';
                }
                return data;
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

            if (msg[0]) {
                if (msg[0].startsWith('@')) {
                    const checkIfOptedOut = await custom.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["spotify", msg[0].toLowerCase().replace(/@|,/g, '')]);

                   if (checkIfOptedOut.length && (user['username'] != msg[0].toLowerCase().replace(/@|,/g, ''))) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }

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
                        WHERE platform="spotify" AND user="${findUser[0].userId}"
                        `);

                    if (!isRegistered.length) {
                        return `${user['username']}, this user is not registered for this command.`;
                    }

                    if (isRegistered[0].allowLookup === "N") {
                        return `${user['username']}, this user's settings do not allow for a song lookup.`;
                    }

                    const usersSong = await apiCall("https://api.spotify.com/v1/me/player/currently-playing", findUser[0].username);

                    if (!usersSong) {
                        return `${user['username']}, there is no song playing on ${findUser[0].username}'s Spotify.`;
                    }

                    const [artist, songTitle] = new ModifyOutput([usersSong.item.artists[0].name, usersSong.item.name]).trimmer();

                    const response = `Current song playing on ${findUser[0].username}'s Spotify:
                    ${songTitle} by ${artist}, ${usersSong.is_playing ? '▶ ' : '⏸ '}
                    [${minutes(usersSong.progress_ms)}:${seconds(usersSong.progress_ms)}/${minutes(usersSong.item.duration_ms)}:${seconds(usersSong.item.duration_ms)}] `;

                    try {
                        const youtubeUser = await custom.youtube(`${usersSong.item.name} by ${usersSong.item.artists[0].name}`);

                        if (channel === "#forsen") { return response; }

                        return response + youtubeUser.url;
                    } catch (err) {
                        if (err.error?.code === 403) {
                            return response + ' [ran out of youtube queries]';
                        }

                        if (msg[0]) {
                            if (msg[0].startsWith('@')) {
                                return `${user['username']}, there is no song playing on ${findUser[0].username}'s Spotify.`;
                            }
                        }
                        console.log(err);
                    }
                }
            }

            const userList = await custom.doQuery(`
                SELECT *
                FROM access_token
                WHERE platform="spotify"
                `);

            const users = userList.map(i => i.user)

            const permittedUsers = users.filter(i => i === user['user-id']);

            if (!permittedUsers.length) {
                if (channel === '#forsen') {
                    return `${user['username']}, To get access to this command, follow the login process on kunszg(dot)com/connections`;
                }
                return `${user['username']}, To get access to this command, follow the login process on https://kunszg.com/connections`;
            }

            const premUsers = userList.filter(i => i.premium === "Y").map(i => i.user)
            const premiumUsers = premUsers.filter(i => i === user['user-id']);

            const song = await apiCall('https://api.spotify.com/v1/me/player/currently-playing', user['username'], 'GET');

            if ((msg[0] === "play" || msg[0] === "queue") || (msg[0] === "p" || msg[0] === "q")) {
                try {
                    if (!msg[1]) {
                        return `${user['username']}, you did not provide anything to search for FeelsDankMan`;
                    }

                    if (!premiumUsers.length) {
                        return `${user['username']}, only Spotify premium users can use this parameter :(`;
                    }

                    const search = await apiCall(`https://api.spotify.com/v1/search?q=${msg.splice(1).join(' ')}&type=track`, user['username'], 'GET');

                    if (!search.tracks.items.length) {
                        return `${user['username']}, no tracks were found with given query.`;
                    }

                    await apiCall(`https://api.spotify.com/v1/me/player/queue?uri=${search.tracks.items[0].uri}`, user['username'], 'POST');

                    const checkIfStartedPlaying = await apiCall('https://api.spotify.com/v1/me/player/currently-playing', user['username'], 'GET');

                    let [playing, artist] = new ModifyOutput([search.tracks.items[0].name, search.tracks.items[0].artists[0].name]).trimmer();

                    if ((msg[0] === "p" || msg[0] === "play") && (checkIfStartedPlaying.item.name != search.tracks.items[0].name)) {
                        await apiCall('https://api.spotify.com/v1/me/player/next', user['username'], 'POST');
                        return `${user['username']}, now playing: ${playing} by ${artist} on your Spotify.`;
                    }

                    return `${user['username']}, ${playing} by ${artist} has been added to your playback queue.`;
                } catch (err) {
                    console.log(err);
                    return `${user['username']}, no active devices were found. You should have your spotify running while using this command.`;
                }
            }

            if (msg[0] === "top") {
                const timeRange = msg.find(i => i.toLowerCase() === "long" || i.toLowerCase() === "medium" || i.toLowerCase() === "short") ?? "long";

                const findUser = msg.find(i => i.startsWith("@"));

                if (findUser) {
                    const checkIfOptedOut = await custom.query(`
                        SELECT *
                        FROM optout
                        WHERE command=? AND username=?`,
                        ["spotify", findUser.toLowerCase().replace(/@|,/g, '')]);

                   if (checkIfOptedOut.length && (user['username'] != findUser.toLowerCase().replace(/@|,/g, ''))) {
                        return `${user['username']}, that user has opted out from being a target of this command.`;
                    }

                    const checkIfUserRegistered = await custom.doQuery(`
                        SELECT *
                        FROM access_token
                        WHERE username="${findUser.toLowerCase().replace(/@|,/g, "")}"
                        `);
                    if (!checkIfUserRegistered.length) {
                        return `${user['username']}, specified user is not registered for this command`;
                    }
                    if (checkIfUserRegistered[0].allowLookup === "N") {
                        return `${user['username']}, specified user does not allow for data lookup. They can enable it by typing "kb spotify allow"`;
                    }

                    if (msg.find(i => i.toLowerCase() === "artists") || msg.find(i => i.toLowerCase() === "artist")) {
                        const topArtistData = await apiCall(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange.toLowerCase()}_term`, findUser.replace("@", "").replace(",", ""));

                        let [artist1, artist2, artist3, artist4, artist5]  = new ModifyOutput(topArtistData.items.slice(0, 5).map(i => i.name), 20).trimmer();

                        return `${user['username']}, that user's ${timeRange} term most listened to Spotify artists are:
                        (1) ${artist1}, (2) ${artist2}, (3) ${artist3}, (4) ${artist4}, (5) ${artist5}`.replace(/undefined/g, "podcast");
                    }

                    const topTracksData = await apiCall(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange.toLowerCase()}_term`, findUser.replace("@", "").replace(",", ""));

                    let [song1, song2, song3] = new ModifyOutput(topTracksData.items.slice(0, 3).map(i => i.name)).trimmer();
                    let [artist1, artist2, artist3] = new ModifyOutput(topTracksData.items.slice(0, 3).map(i => i.artists[0].name)).trimmer();

                    return `${user['username']}, that user's ${timeRange} term most listened to Spotify songs are:
                    (1) ${song1} by ${artist1}, (2) ${song2} by ${artist2}, (3) ${song3} by ${artist3}`.replace(/undefined/g, "podcast");
                }

                if (msg[1] != "artists" || !msg[1]) {
                    const topTracksData = await apiCall(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange.toLowerCase()}_term`);

                    let [song1, song2, song3] = new ModifyOutput(topTracksData.items.slice(0, 3).map(i => i.name)).trimmer();
                    let [artist1, artist2, artist3] = new ModifyOutput(topTracksData.items.slice(0, 3).map(i => i.artists[0].name)).trimmer();

                    return `${user['username']}, your ${timeRange} term most listened to Spotify songs are:
                    (1) ${song1} by ${artist1}, (2) ${song2} by ${artist2}, (3) ${song3} by ${artist3}`.replace(/undefined/g, "podcast");
                }

                const topArtistData = await apiCall(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange.toLowerCase()}_term`);

                let [artist1, artist2, artist3, artist4, artist5] = new ModifyOutput(topArtistData.items.slice(0, 5).map(i => i.name), 20).trimmer();

                return `${user['username']}, your ${timeRange} term most listened to Spotify artists are:
                (1) ${artist1}, (2) ${artist2}, (3) ${artist3}, (4) ${artist4}, (5) ${artist5}`.replace(/undefined/g, "podcast");
            }

            if (message.split(' ')[2] === "unregister") {
                const checkIfUserRegistered = await custom.doQuery(`
                    SELECT *
                    FROM access_token
                    WHERE platform="spotify" AND user="${user['user-id']}"
                    `);
                if (!checkIfUserRegistered.length) {
                    return `${user['username']}, you are not registered for this command.`;
                }

                await custom.doQuery(`
                    DELETE FROM access_token
                    WHERE user="${user['user-id']}" AND platform="spotify"
                    `);

                return `${user['username']}, you have been successfully unregistered fron Spotify command.`;
            }

            if (msg[0] === "start") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/play', user['username'], 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been resumed.');
                    return '';
                }
                return `${user['username']}, current song has been resumed.`;
            }

            if (msg[0] === "pause" || msg[0] === "stop") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }
                if (!song?.item) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/pause', user['username'], 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been stopped.');
                    return '';
                }
                return `${user['username']}, current song has been stopped.`;
            }

            if (msg[0] === "volume" || msg[0] === "vol") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }

                if (!song?.item) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                const playback = await apiCall("https://api.spotify.com/v1/me/player", user['username']);

                if (!msg[1]) {
                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], `Current volume on your spotify is ${playback.device.volume_percent}%.`);
                        return '';
                    }
                    return `${user['username']}, Current volume on your spotify is ${playback.device.volume_percent}%.`;
                }

                this.msg = msg[1].replace('%', '');

                if (!custom.hasNumber(this.msg)) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                if (this.msg > 100 || this.msg < 0) {
                    return `${user['username']}, only numbers within range of 0-100 are accepted.`;
                }

                await apiCall(`https://api.spotify.com/v1/me/player/volume?volume_percent=${this.msg}`, user['username'], 'PUT');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], `Volume on your spotify has been changed from ${playback.device.volume_percent}% to ${this.msg}%.`);
                    return '';
                }
                return `${user['username']}, volume on your spotify has been changed from ${playback.device.volume_percent}% to ${this.msg}%.`;
            }

            if (msg[0] === "skip") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }
                if (!song?.item) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                await apiCall('https://api.spotify.com/v1/me/player/next', user['username'], 'POST');

                if (custom.strictChannels(channel)) {
                    kb.whisper(user['username'], 'Current song has been successfully skipped.');
                    return '';
                }
                return `${user['username']}, current song has been successfully skipped.`;
            }

            if (msg[0] === "shuffle" || msg[0] === "random") {
                if (!premiumUsers.length) {
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }
                if (!song?.item) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                if (msg[1] === "true" || msg[1] === "on") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=true', user['username'], 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Your playback mode is now set to shuffle.');
                        return '';
                    }
                    return `${user['username']}, your playback mode is now set to shuffle.`;
                }

                if (msg[1] === "false" || msg[1] === "off") {
                    await apiCall('https://api.spotify.com/v1/me/player/shuffle?state=false', user['username'], 'PUT');

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
                    return `${user['username']}, only Spotify premium users can use this parameter :(`;
                }
                if (!song?.item) {
                    return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
                }

                if (msg[1] === "track") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=track', user['username'], 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Repeat mode on your spotify is now set to repeat current track.');
                        return '';
                    }
                    return `${user['username']}, repeat mode on your spotify is now set to repeat current track.`;
                }

                if (msg[1] === "context") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=context', user['username'], 'PUT');

                    if (custom.strictChannels(channel)) {
                        kb.whisper(user['username'], 'Repeat mode on your spotify is now set to repeat current context.');
                        return '';
                    }
                    return `${user['username']}, repeat mode on your spotify is now set to repeat current context.`;
                }

                if (msg[1] === "off" || msg[1] === "false") {
                    await apiCall('https://api.spotify.com/v1/me/player/repeat?state=off', user['username'], 'PUT');

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
                    WHERE platform="spotify" AND user="${user['user-id']}"
                    `);
                return `${user['username']}, you allowed other registered users to lookup your playing songs.`;
            }

            if (msg[0] === "disallow") {
                await custom.doQuery(`
                    UPDATE access_token
                    SET allowLookup="N"
                    WHERE platform="spotify" AND user="${user['user-id']}"
                    `);
                return `${user['username']}, other users won't be able to view your currently playing song anymore.`;
            }

            if (!song?.item ?? true) {
                return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
            }

            const [artist, songTitle] = new ModifyOutput([song.item.artists[0].name, song.item.name]).trimmer();

            const response = `Current song playing on ${user['username']}'s Spotify:
            ${songTitle} by ${artist}, ${song.is_playing ? '▶ ' : '⏸ '}
            [${minutes(song.progress_ms)}:${seconds(song.progress_ms)}/${minutes(song.item.duration_ms)}:${seconds(song.item.duration_ms)}] `;

            try {
                if (channel === "#forsen") { return response;}

                const youtube = await custom.youtube(`${song.item.name} by ${song.item.artists[0].name}`);
                return response + youtube.url;
            } catch (err) {
                if (err.error?.code === 403) {
                    return response + ' [ran out of youtube queries]';
                }
                console.log(err)
                return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
            }
        } catch (err) {
            if (err.response?.statusCode) {
                return `${user['username']}, ${custom.status(err.response.statusCode)} FeelsDankMan`;
            }
            console.log(err)
            return `${user['username']}, no song is currently playing on your spotify FeelsDankMan`;
        }
    }
}
