#!/usr/bin/env node
'use strict';

const creds = require('../credentials/config.js');
const utils = require('../utils/utils.js');
const got = require('got');

const currDate = new Date();

const aliasListing = async() => {
    const fs = require('fs');
    const data = await utils.query('SELECT * FROM commands');
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
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`);
        utils.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`)
    }
}
setInterval(() => {
    supinicAliveCheck();
}, 300000); // every 5m

const getTokenTwitch = async() => {
    try {
        const refreshToken = await utils.query(`
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

        await utils.query(`
            UPDATE access_token
            SET access_token=?
            WHERE platform="twitch"`,
            [token.access_token]);
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request from getTokenTwitch()`);
        utils.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request from getTokenTwitch()`)
    }
}
getTokenTwitch()
setInterval(()=>{ getTokenTwitch() }, 10800000); // every 3h

const cleanEntries = async() => {
    await utils.query(`
        DELETE FROM access_token
        WHERE platform="spotify"
            AND date < now() - interval 15 MINUTE
            AND user IS NULL
            AND code != "Resolved"`);

    await utils.query(`
        DELETE FROM access_token
        WHERE platform="lastfm"
            AND date < now() - interval 15 MINUTE
            AND code != "lastfm"
            AND userName IS NULL`);

    await utils.query(`
        DELETE FROM access_token
        WHERE platform IS NULL
            AND DATE < now() - interval 15 MINUTE
            AND user IS NULL
            AND code != "Resolved"
            AND refresh_token IS NULL

        `);
}
setInterval(()=>{ cleanEntries() }, 10000); // every 10s

const updateAllEmotes = async (channelName) => {
    try {
        const emotes = await utils.query(`
            SELECT *
            FROM emotes
            WHERE channel=?`,
            [channelName]);

        const userId = await utils.query(`
            SELECT *
            FROM channels_logger
            WHERE channel=?`,
            [channelName]);


        // 7TV

        try {
            const seventvEmotes = await got(`https://api.7tv.app/v2/users/${userId[0].userId}/emotes`).json();

            if (seventvEmotes.length) {
                // check if emote exists in database
                // if not, add it
                const checkForRepeatedEmotesSeventv = async (emote, id, type) => {
                    if ((typeof seventvEmotes.message != "undefined") || !seventvEmotes) {
                        return '';
                    }

                    const updateEmotes = emotes.find(i => i.sevenTvId === id);
                    if (!updateEmotes) {
                        const findEmote = seventvEmotes.filter(i => i.id === id);
                        const emoteLink = findEmote[0].urls[0][1];

                        await utils.query(`
                            INSERT INTO emotes (userId, channel, emote, url, type, sevenTvId, date)
                            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                            [userId[0].userId, channelName, emote, emoteLink, type, id]);
                    }
                }

                // iterate through 7TV emotes
                // and check if any of the emotes doesn't exist in the set anymore
                for (let j = 0; j < emotes.length; j++) {
                    if ((typeof seventvEmotes.message != "undefined") || !seventvEmotes) {
                        return '';
                    }

                    if (emotes[j].type === "7tv") {
                        if (!seventvEmotes.some(i => emotes[j].sevenTvId === i.id)) {
                            await utils.query(`
                                DELETE FROM emotes
                                WHERE ID=?`,
                                [emotes[j].ID]);

                            await utils.query(`
                                INSERT INTO emotes_removed (userId, channel, emote, url, sevenTvId, date, type)
                                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "7tv")`,
                                [userId[0].userId, channelName, emotes[j].emote, emotes[j].url, emotes[j].sevenTvId]);
                        }
                    }
                }
                seventvEmotes.map(i => checkForRepeatedEmotesSeventv(i.name, i.id, "7tv"));
            }
        } catch (err) {}


        // BTTV

        try {
            const bttvEmotes = await got(`https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}`).json();

            const allBttvEmotes = bttvEmotes.channelEmotes.concat(bttvEmotes.sharedEmotes);

            // check if emote exists in database
            // if not, add it
            const checkForRepeatedEmotesBttv = async (emote, id, type) => {
                if ((typeof bttvEmotes.message != "undefined") || !bttvEmotes) {
                    return '';
                }

                const updateEmotes = emotes.find(i => i.url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === id);
                if (!updateEmotes) {
                    const findEmote = allBttvEmotes.filter(i => i.id === id);
                    const emoteLink = `https://cdn.betterttv.net/emote/${findEmote[0].id}/1x`;

                    await utils.query(`
                        INSERT INTO emotes (userId, channel, emote, url, type, date)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [userId[0].userId, channelName, emote, emoteLink, type]);
                }
            }

            // iterate through BTTV emotes
            // and check if any of the emotes doesn't exist in the set anymore
            for (let j=0; j<emotes.length; j++) {
                if ((typeof bttvEmotes.message != "undefined") || !bttvEmotes) {
                    break;
                }

                if (emotes[j].type === "bttv") {
                    if (!allBttvEmotes.some(i => emotes[j].url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === i.id)) {
                        await utils.query(`
                            DELETE FROM emotes
                            WHERE ID=?`,
                            [emotes[j].ID]);

                        await utils.query(`
                            INSERT INTO emotes_removed (userId, channel, emote, url, date, type)
                            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, "bttv")`,
                            [userId[0].userId, channelName, emotes[j].emote, emotes[j].url]);
                    }
                }
            }
            allBttvEmotes.map(i => checkForRepeatedEmotesBttv(i.code, i.id, "bttv"));
        } catch (err) {}


        // FFZ

        try {
            const ffzEmotes = await got(`https://api.frankerfacez.com/v1/room/id/${userId[0].userId}`).json();

            const setId = Object.keys(ffzEmotes.sets)[0];

            const checkForRepeatedEmotesFfz = async (emote, id, type) => {
                if ((typeof ffzEmotes.error != "undefined") || !ffzEmotes) {
                    return '';
                }

                const updateEmotes = emotes.find(i => i.emoteId === id);
                if (!updateEmotes) {
                    const findEmote = ffzEmotes.sets[setId].emoticons.filter(i => i.id === id);

                    await utils.query(`
                        INSERT INTO emotes (userId, channel, emote, url, emoteId, type, date)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [userId[0].userId, channelName, emote, findEmote[0].urls["1"], id, type]);
                }
            }


            // iterate through FFZ emotes
            // and check if any of the emotes doesn't exist in the set anymore
            for (let j=0; j<emotes.length; j++) {
                if ((typeof ffzEmotes.error != "undefined") || !ffzEmotes) {
                    break;
                }

                if (emotes[j].type === "ffz") {
                    if (!ffzEmotes.sets[setId].emoticons.some(i => emotes[j].emoteId === (i.id))) {
                        await utils.query(`
                            DELETE FROM emotes
                            WHERE ID=?`,
                            [emotes[j].ID]);

                        await utils.query(`
                            INSERT INTO emotes_removed (userId, channel, emote, url, emoteId, date, type)
                            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "ffz")`,
                            [userId[0].userId, channelName, emotes[j].emote, emotes[j].url, emotes[j].emoteId]);
                    }
                }
            }

            ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotesFfz(i.name, i.id, "ffz"));
        } catch (err) {}
    } catch (err) {
        if (err.message.includes("404")) {
            return;
        }
        if (err?.status === 404 ?? false) {
            return;
        }
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`);
        utils.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`)
    }
}
setInterval(async() => {
    const channels = await utils.query(`
        SELECT *
        FROM channels_logger
        WHERE userId != "193071040" AND userId != "229225576"`); // simpdepirulito kunszgbot

    const channelsArr = channels.map(i => i.channel);

    for (let i=0; i<channelsArr.length; i++) {
        setTimeout(async() => {
            updateAllEmotes(channelsArr[i]);

            await utils.query(`
                UPDATE channels_logger
                SET emotesUpdate="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
                WHERE channel="${channelsArr[i]}"
                `);
        }, i * 800)
    }
}, 360000); // every 6m

setInterval(async() => {
    try {
        const channels = await utils.query("SELECT * FROM channels");
        const token = await utils.query("SELECT * FROM access_token WHERE platform='twitch'");

        this.channels = channels.map(i => `&user_login=${i.channel}`)

        function* chunks(arr, n) {
            for (let i = 0; i < arr.length; i += n) {
                yield arr.slice(i, i + n);
            }
        }

        this.channels = [...chunks(this.channels, 99)]

        await utils.query(`UPDATE channels SET status="offline"`);

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
                await utils.query(`
                    UPDATE channels
                    SET status=?
                    WHERE userId=? AND status="offline"`,
                    ["live", liveStatus.data[i].user_id]);
            }
        }
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`);
        utils.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err?.response?.requestUrl ?? "nourl"}`)
    }
}, 300000); // every 5m

const updateStats = async () => {
    const userCount = await utils.query("SELECT COUNT(*) as count FROM user_list");
    const commandsCount = await utils.query("SELECT COUNT(*) as count FROM executions");

    const isoDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await utils.query(`
        UPDATE stats
        SET count="${commandsCount[0].count}",
            date="${isoDate}"
        WHERE type="statsApi" AND sha="commandExecs"`);

    await utils.query(`
        UPDATE stats
        SET count="${userCount[0].count}",
            date="${isoDate}"
        WHERE type="statsApi" AND sha="totalUsers"`);
}
updateStats();

setInterval(() => {
    updateStats();
}, 1200000); // every 20m