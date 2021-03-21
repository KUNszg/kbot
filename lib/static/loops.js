#!/usr/bin/env node
'use strict';

const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const got = require('got');

const currDate = new Date();

const aliasListing = async() => {
    const fs = require('fs');
    const data = await custom.query('SELECT * FROM commands');
    const list = data.filter(i => i.aliases != null);

    let aliasList = [];

    for (let i = 0; i<list.length; i++) {
        aliasList.push(list[i].aliases.replace(/\//g, list[i].command).split(";"))
    }

    aliasList = [].concat.apply([], aliasList)

    aliasList = aliasList.map(i => JSON.parse('{"'+i.split('>')[0] + '": "' + i.split('>')[1] + '"}'))

    fs.writeFileSync('./data/aliases.json', JSON.stringify(aliasList))
}
aliasListing();
setInterval(() => {
    aliasListing();
}, 1800000); // every 30m

const supinicAliveCheck = async() => {
    try {
        await got(creds.supinic, {
            method: 'PUT'
        }).json();
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}
setInterval(() => {
    supinicAliveCheck();
}, 300000); // every 5m

const getTokenTwitch = async() => {
    try {
        const refreshToken = await custom.query(`
            SELECT *
            FROM access_token
            WHERE platform="twitch"`);

        const token = await got(`https://id.twitch.tv/oauth2/token?client_secret=${creds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}`, {
                method: "POST",
                headers: {
                    "Client-ID": creds.client_id,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
        }).json();

        await custom.query(`
            UPDATE access_token
            SET access_token=?
            WHERE platform="twitch"`,
            [token.access_token]);
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}
getTokenTwitch()
setInterval(()=>{ getTokenTwitch() }, 14400000); // every 4h

const cleanEntries = async() => {
    await custom.query(`
        DELETE FROM access_token
        WHERE platform="spotify"
            AND date < now() - interval 15 MINUTE
            AND user IS NULL
            AND code != "Resolved"`);

    await custom.query(`
        DELETE FROM access_token
        WHERE platform="lastfm"
            AND date < now() - interval 15 MINUTE
            AND code != "lastfm"
            AND userName IS NULL`);

    await custom.query(`
        DELETE FROM access_token
        WHERE platform IS NULL
            AND DATE < now() - interval 15 MINUTE
            AND user IS NULL
            AND code != "Resolved"
            AND refresh_token IS NULL

        `);
}
setInterval(()=>{ cleanEntries() }, 10000); // every 10s

const updateCommits = async() => {
    try {
        const commitData = await got('https://api.github.com/repos/KUNszg/kbot/commits?per_page=1').json()

        if (commitData[0]?.commit ?? false) {
            await custom.query(`
                UPDATE stats
                SET date=?, sha=?
                WHERE type="ping"`,
                [commitData[0].commit.committer.date, commitData[0].sha.slice(0, 7)]);
        }
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}
updateCommits()
setInterval(()=>{updateCommits()}, 10800000); // every 3h

const updateAllEmotes = async (channelName) => {
    try {
        const emotes = await custom.query(`
            SELECT *
            FROM emotes
            WHERE channel=?`,
            [channelName]);

        const userId = await custom.query(`
            SELECT *
            FROM channels_logger
            WHERE channel=?`,
            [channelName]);

        const ffzEmotes = await got(`https://api.frankerfacez.com/v1/room/id/${userId[0].userId}`).json();

        const bttvEmotes = await got(`https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}`).json();

        if (ffzEmotes?.error ?? false) {
            return;
        }

        if (bttvEmotes?.message ?? false) {
            return;
        }

        if (!ffzEmotes) {
            return;
        }

        if (!bttvEmotes) {
            return;
        }

        const setId = Object.keys(ffzEmotes.sets)[0];

        const allBttvEmotes = bttvEmotes.channelEmotes.concat(bttvEmotes.sharedEmotes);

        // check if emote exists in database
        // if not, add it
        const checkForRepeatedEmotes = async (emote, id, type) => {
            if (type === "bttv") {
                const updateEmotes = emotes.find(i => i.url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === id);
                if (!updateEmotes) {
                    const findEmote = allBttvEmotes.filter(i => i.id === id);
                    const emoteLink = `https://cdn.betterttv.net/emote/${findEmote[0].id}/1x`;

                    await custom.query(`
                        INSERT INTO emotes (channel, emote, url, type, date)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [channelName, emote, emoteLink, type]);
                }
            }

            if (type === "ffz") {
                const updateEmotes = emotes.find(i => i.emoteId === id);
                if (!updateEmotes) {
                    const findEmote = ffzEmotes.sets[setId].emoticons.filter(i => i.id === id);

                    await custom.query(`
                        INSERT INTO emotes (channel, emote, url, emoteId, type, date)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [channelName, emote, findEmote[0].urls["1"], findEmote[0].id, type]);
                }
            }

        }

        // iterate through BBTV emotes
        // and check if any of the emotes doesn't exist in the set anymore
        for (let j=0; j<emotes.length; j++) {
            if (emotes[j].emoteId === null) {
                if (!allBttvEmotes.some(i => emotes[j].url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === (i.id))) {
                    if (!emotes.length) {
                        return;
                    }
                    await custom.query(`
                        DELETE FROM emotes
                        WHERE ID=?`,
                        [emotes[j].ID]);

                    await custom.query(`
                        INSERT INTO emotes_removed (channel, emote, url, date, type)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP, "bttv")`,
                        [channelName, emotes[j].emote, emotes[j].url]);
                }
            }
        }

        // iterate through FFZ emotes
        // and check if any of the emotes doesn't exist in the set anymore
        for (let j=0; j<emotes.length; j++) {
            if (emotes[j].emoteId != null) {
                if (!ffzEmotes.sets[setId].emoticons.some(i => emotes[j].emoteId === (i.id))) {
                    if (!emotes.length) {
                        return;
                    }
                    await custom.query(`
                        DELETE FROM emotes
                        WHERE ID=?`,
                        [emotes[j].ID]);

                    await custom.query(`
                        INSERT INTO emotes_removed (channel, emote, url, emoteId, date, type)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, "ffz")`,
                        [channelName, emotes[j].emote, emotes[j].url, emotes[j].emoteId]);
                }
            }
        }

        allBttvEmotes.map(i => checkForRepeatedEmotes(i.code, i.id, 'bttv'));
        ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotes(i.name, i.id, 'ffz'));
    } catch (err) {
        if (err.message.includes("404")) {
            return;
        }
        if (err?.status === 404 ?? false) {
            return;
        }
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response.requestUrl ?? "nourl"}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response.requestUrl ?? "nourl"}`)
    }
}

setInterval(async() => {
    const channels = await custom.query(`
        SELECT *
        FROM channels_logger
        WHERE userId != "193071040" AND userId != "229225576"`); // simpdepirulito kunszgbot

    const channelsArr = channels.map(i => i.channel);

    for (let i=0; i<channelsArr.length; i++) {
        setTimeout(() => {
            updateAllEmotes(channelsArr[i])
        }, i * 2500)
    }
}, 600000); // every 10m

setInterval(async() => {
    try {
        const channels = await custom.query("SELECT * FROM channels");
        const token = await custom.query("SELECT * FROM access_token WHERE platform='twitch'");

        this.channels = channels.map(i => `&user_login=${i.channel}`)

        function* chunks(arr, n) {
            for (let i = 0; i < arr.length; i += n) {
                yield arr.slice(i, i + n);
            }
        }

        this.channels = [...chunks(this.channels, 99)]

        await custom.query(`UPDATE channels SET status="offline"`);

        for (let i = 0; i < this.channels.length; i++) {
            this.query = this.channels[i].join('').replace('&', '?');

            const liveStatus = await got(`https://api.twitch.tv/helix/streams${this.query}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token[0].access_token}`,
                    'Client-ID': creds.client_id,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).json();

            if (!liveStatus?.data ?? true) {
                return;
            }

            for (let i = 0; i < liveStatus.data.length; i++) {
                await custom.query(`
                    UPDATE channels
                    SET status=?
                    WHERE userId=? AND status="offline"`,
                    ["live", liveStatus.data[i].user_id]);
            }
        }
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}, 300000); // every 5m