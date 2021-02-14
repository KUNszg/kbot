const creds = require('../credentials/config.js');
const custom = require('../utils/functions.js');
const got = require('got');

const currDate = new Date();

const supinicAliveCheck = async () => {
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

const getTokenTwitch = async () => {
    try {
        const refreshToken = await custom.doQuery(`
            SELECT *
            FROM access_token
            WHERE platform="twitch"
            `);

        const token = await got(`https://id.twitch.tv/oauth2/token?client_secret=${creds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken[0].refresh_token}`, {
                method: "POST",
                headers: {
                    "Client-ID": creds.client_id,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
        }).json();

        await custom.doQuery(`
            UPDATE access_token
            SET access_token="${token.access_token}"
            WHERE platform="twitch"
            `);
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}
getTokenTwitch()
setInterval(()=>{ getTokenTwitch() }, 14400000); // every 4h

const cleanEntries = async () => {
    await custom.doQuery(`
        DELETE FROM access_token
        WHERE platform="spotify"
            AND date < now() - interval 15 MINUTE
            AND user IS NULL
            AND code != "Resolved"
        `);
    await custom.doQuery(`
        DELETE FROM access_token
        WHERE platform="lastfm"
            AND date < now() - interval 15 MINUTE
            AND code != "lastfm"
            AND userName IS NULL
        `);
}
setInterval(()=>{ cleanEntries() }, 10000); // every 10s

const updateCommits = async() => {
    try {
        const commitData = await got('https://api.github.com/repos/KUNszg/kbot/commits?per_page=1').json()

        if (commitData[0]?.commit ?? false) {
            await custom.doQuery(`
                UPDATE stats
                SET date="${commitData[0].commit.committer.date}",
                    sha="${commitData[0].sha.slice(0, 7)}"
                WHERE type="ping"
                `);
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
        const emotes = await custom.doQuery(`
            SELECT *
            FROM emotes
            WHERE channel="${channelName}"
            `);

        const userId = await custom.doQuery(`
            SELECT *
            FROM channels_logger
            WHERE channel="${channelName}"
            `);

        const ffzEmotes = await got(`https://api.frankerfacez.com/v1/room/${channelName}`).json();

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

                    await custom.doQuery(`
                        INSERT INTO emotes (channel, emote, url, date, type)
                        VALUES ("${channelName}", "${emote}", "${emoteLink}", CURRENT_TIMESTAMP, "${type}")
                        `);
                }
            }

            if (type === "ffz") {
                const updateEmotes = emotes.find(i => i.emoteId === id);
                if (!updateEmotes) {
                    const findEmote = ffzEmotes.sets[setId].emoticons.filter(i => i.id === id);

                    await custom.doQuery(`
                        INSERT INTO emotes (channel, emote, url, emoteId, date, type)
                        VALUES ("${channelName}", "${emote}", "${findEmote[0].urls["1"]}", "${findEmote[0].id}", CURRENT_TIMESTAMP, "${type}")
                        `);
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
                    await custom.doQuery(`
                        DELETE FROM emotes
                        WHERE ID="${emotes[j].ID}"
                        `);

                    await custom.doQuery(`
                        INSERT INTO emotes_removed (channel, emote, date, type, url)
                        VALUES ("${channelName}", "${emotes[j].emote}", CURRENT_TIMESTAMP, "bttv", "${emotes[j].url}")
                        `);
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
                    await custom.doQuery(`
                        DELETE FROM emotes
                        WHERE ID="${emotes[j].ID}"
                        `);

                    await custom.doQuery(`
                        INSERT INTO emotes_removed (channel, emote, date, type, url, emoteId)
                        VALUES ("${channelName}", "${emotes[j].emote}", CURRENT_TIMESTAMP, "ffz", "${emotes[j].url}", "${emotes[j].emoteId}")
                        `);
                }
            }
        }

        allBttvEmotes.map(i => checkForRepeatedEmotes(i.code, i.id, 'bttv'));
        ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotes(i.name, i.id, 'ffz'));
    } catch (err) {
        if (err.message.includes("404")) {
            return;
        }
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}
setInterval(async() => {
    const channels = await custom.doQuery(`
        SELECT *
        FROM channels_logger
        WHERE userId != "193071040" AND
            userId != "462868995" AND
            userId != "229225576" AND
            userId != "72052104"
            `); // simpdepirulito donaldtrump kunszgbot backous
    const channelsArr = channels.map(i => i.channel);

    for (let i=0; i<channelsArr.length; i++) {
        setTimeout(() => {
            updateAllEmotes(channelsArr[i])
        }, i * 2500)
    }
}, 420000); // every 7m


setInterval(async () => {
    try {
        const partyData = await custom.doQuery(`
            SELECT *
            FROM party
            ORDER BY expires
            ASC
            `);

        const expires = Date.parse(partyData[0].expires);
        const diff = (Date.now() - expires)/1000;
        if (diff>=15) {
            await custom.doQuery(`
                DELETE FROM party WHERE ID="${partyData[0].ID}";
                `);
            return;
        }
    } catch (err) {
        console.log(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`);
        custom.errorLog(`Date: ${currDate.toUTCString()} # Error: ${err.message} # Request URL: ${err.response.requestUrl}`)
    }
}, 3000);