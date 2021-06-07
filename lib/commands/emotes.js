#!/usr/bin/env node
'use strict';

const got = require('got');
const utils = require('../utils/utils.js');

let cache = [];

// clear cache every 5 hours
setInterval(() => {
    cache.length = 0;
}, 18000000);

module.exports = {
	name: "kb emotes",
	invocation: async (channel, user, message, platform) => {
		try {
            let _message = message.split(' ')[1].toLowerCase();
            _message = _message.replace(/\bemotesearch\b|\bes\b/g, "emote");

			let msg = (_message=== "removed") || (_message === "emote") ? utils.getParam(message, 1) : utils.getParam(message);

            if ((msg[0] === "list" || msg[0] === "link") || (msg[0] === "-list" || msg[0] === "-link")) {
                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }
                return `${user['username']}, see full list of emotes: https://kunszg.com/emotes?search=${channel.replace('#', '')}`;
            }

            if (msg[0] === "api") {
                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }
                if (await utils.checkPermissions(user['username'])<1) {
                    return `${user['username']}, You don't have permissions to use this parameter :(`;
                }

                const userId = await utils.query(`
                    SELECT *
                    FROM channels
                    WHERE channel=?`,
                    [channel.replace('#', '')]);

                return `${user['username']}, //FFZ https://api.frankerfacez.com/v1/room/id/${userId[0].userId}
                    //BTTV https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}
                    //7TV https://api.7tv.app/v2/users/${userId[0].userId}/emotes`;
            }

			if (msg[0] === "yoink" || msg[0] === "reload") {
                if (await utils.checkPermissions(user['username'])<1) {
                    return `${user['username']}, You don't have permissions to use this parameter :(`;
                }

                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }

				const channelName = channel.replace('#', '')

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

                let errMessage = "";

                // 7TV

                try {
                    const seventvEmotes = await got(`https://api.7tv.app/v2/users/${userId[0].userId}/emotes`).json();

                    if (!seventvEmotes.length) {
                        throw "err";
                    }

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
                } catch (err) { errMessage += "7tv " }


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
                            if (!allBttvEmotes.some(i => emotes[j].url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === (i.id))) {
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
                } catch (err) { errMessage += "bttv " }


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
                                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, "ffz",)`,
                                    [userId[0].userId, channelName, emotes[j].emote, emotes[j].url, emotes[j].emoteId]);
                            }
                        }
                    }

                    ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotesFfz(i.name, i.id, "ffz"));
                } catch (err) { errMessage += "ffz"}

                if (errMessage) {
                    return `${user['username']}, could not find emotes from following services: ${errMessage}, command completed successfully.`;
                }

                return `${user['username']}, done TriHard`;
			}

            const formatDate = (timestamp) => {
                const time = Date.now() - Date.parse(timestamp);

                const seconds = Number(time/1000);
                const d = Math.floor(seconds / (3600*24));
                const h = Math.floor(seconds % (3600*24) / 3600);
                const m = Math.floor(seconds % 3600 / 60);
                const s = Math.floor(seconds % 60);

                const dDisplay = d > 0 ? d + "d " : "";
                const hDisplay = h > 0 ? h + "h " : "";
                const mDisplay = m > 0 ? m + "m " : "";
                const sDisplay = s > 0 ? s + "s " : "";

                if (seconds > 86400) { // day in seconds
                    return `${dDisplay}${hDisplay} ago`;
                }
                if (seconds > 3600) { // hour in seconds
                    return `${hDisplay}${mDisplay} ago`;
                }
                return `${mDisplay}${sDisplay} ago`;
            }

            if ((msg?.[0] ?? false) && (_message === "emote")) {
                if (!msg[1]) {
                    return `${user['username']}, you have to provide an emote to search for.`;
                }

                const userMsg = msg.filter(i => !i.match(/i:\[?(\d+)\]?/))[1];

                if (userMsg.length < 3) {
                    return `${user['username']}, too little characters provided.`;
                }

                if (!cache.filter(i => i[userMsg]).length) {
                    const emotesCurr = await utils.query(`
                        SELECT DISTINCT url, emoteId, type, emote
                        FROM emotes
                        WHERE url IS NOT NULL AND emote=? AND type="ffz"
                        ORDER BY DATE desc`, [userMsg]);

                    const emotesRem = await utils.query(`
                        SELECT DISTINCT url, emoteId, type, emote
                        FROM emotes_removed
                        WHERE url IS NOT NULL AND emote=? AND type="ffz"`, [userMsg]);

                    const emotesBttvApi = [];

                    for (let limit = 100, offset = 0; offset<1500;) {
                        const list = await got(
                            encodeURI(
                                `https://api.betterttv.net/3/emotes/shared/search?query=${userMsg}&offset=${offset}&limit=${limit}`
                                )
                            ).json();

                        if (list.length) {
                            emotesBttvApi.push(list);
                            offset += 100;
                        } else {
                            break;
                        }
                    }

                    const _emotesBttvApi = emotesBttvApi.flat();

                    let bttvEmoteSet = _emotesBttvApi.map(i => `https://betterttv.com/emotes/${i.id}`);

                    let emoteSets = emotesCurr.concat(emotesRem);

                    let ffzEmoteSet = emoteSets
                        .filter(i => i.url != null)
                        .map(i => `https://www.frankerfacez.com/emoticon/${i.emoteId}-${i.emote}`)

                    const platform = msg.find(i => i.match(/\b(-)?(ffz|bttv)\b/i));

                    emoteSets = bttvEmoteSet.concat(ffzEmoteSet);

                    const data = JSON.parse(
                        `{${JSON.stringify(userMsg)}: [{
                            "bttv": ${JSON.stringify(bttvEmoteSet)},
                            "ffz": ${JSON.stringify(ffzEmoteSet)},
                            "emoteSets": ${JSON.stringify(emoteSets)}
                        }]}`);

                    cache.push(data);
                }

                const filter = cache.filter(i => i[userMsg])[0][userMsg][0];

                const ffzEmoteSet = filter.ffz;
                const bttvEmoteSet = filter.bttv;
                const emoteSets = filter.emoteSets;

                if (!emoteSets.length) {
                    return `${user['username']}, no emotes were found.`;
                }

                const results = () => {
                    if (platform) {
                        if (platform.toLowerCase().replace("-", "") === "bttv") {
                            return bttvEmoteSet.length;
                        }
                        return ffzEmoteSet.length;
                    }
                    return emoteSets.length;
                }

                const emote = (index) => {
                    if (platform) {
                        if (platform.toLowerCase().replace("-", "") === "bttv") {
                            return bttvEmoteSet[index];
                        }
                        return ffzEmoteSet[index];
                    }
                    return emoteSets[index];
                }

                if (msg.join(' ').match(/i:\[?(\d+)\]?/)) {
                    const index = msg.join(' ').match(/i:\[?(\d+)\]?/)[0].replace(/i:|\[|\]/g, '');

                    if (typeof emoteSets[Number(index)] === "undefined") {
                        return `${user['username']}, this index does not exist.`;
                    }

                    return `${user['username']}, i:${index} : ${emote(index)} `;
                }

                if (emoteSets.length > 1) {
                    return `${user['username']}, ${results()} results found, use i:[number] as parameter to get them. i:0 : ${emote(0)}`;
                }

                return `${user['username']}, ${emote(0)}`;
            }

            const findParam = msg.filter(i => i.match(/\b-?(bttv|ffz|7tv)\b/gi)).map(i => i.toLowerCase());

            msg = msg.filter(i => !i.match(/\b-?(bttv|ffz|7tv)\b/gi));

            const type = findParam.length ? findParam[0].replace("-", "").toUpperCase() : "";

            if ((msg?.[0] ?? false) && (msg[0] === "removed")) {
                const userSpecifiedChannel = msg.filter(i => i.startsWith('#'));
                if (userSpecifiedChannel.length) {
                    // check if channel exists in the database
                    const checkChannel = await utils.query("SHOW TABLES LIKE ?", [`logs_${userSpecifiedChannel[0].toLowerCase().replace('#', '')}`]);

                    if (!checkChannel.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }

                    let latestRemovedEmotes = await utils.query(`
                        SELECT *
                        FROM emotes_removed
                        WHERE channel=?
                        ORDER BY date
                        DESC`,
                        [userSpecifiedChannel[0].toLowerCase().replace('#', '')]);

                    if (findParam.length) {
                        latestRemovedEmotes = await utils.query(`
                            SELECT *
                            FROM emotes_removed
                            WHERE channel=? AND type=?
                            ORDER BY date
                            DESC`,
                            [userSpecifiedChannel[0].toLowerCase().replace('#', ''), findParam[0].replace(/-/g, "")]);
                    }

                    if (!latestRemovedEmotes.length) {
                        return `${user['username']}, this channel does not have any removed emotes registered in my database yet.`;
                    }

                    const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);
                    const userNoPing = userSpecifiedChannel[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")

                    return `${user['username']}, recently removed ${type} emotes in channel ${userNoPing}: ${emotes.join(', ')}`
                }

                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }

                let latestRemovedEmotes = await utils.query(`
                    SELECT *
                    FROM emotes_removed
                    WHERE channel=?
                    ORDER BY date
                    DESC`,
                    [channel.replace('#', '')]);

                if (findParam.length) {
                    latestRemovedEmotes = await utils.query(`
                        SELECT *
                        FROM emotes_removed
                        WHERE channel=? AND type=?
                        ORDER BY date
                        DESC`,
                        [channel.replace('#', ''), findParam[0].replace(/-/g, "")]);
                }

                if (!latestRemovedEmotes.length) {
                    return `${user['username']}, this channel does not have any removed emotes registered in my database yet.`;
                }

                const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                return `${user['username']}, recently removed ${type} emotes in this channel: ${emotes.join(', ')}`
            }

            if (msg[0]) {
                // check if channel exists in the database
                const checkChannel = await utils.query("SHOW TABLES LIKE ?", [`logs_${msg[0].toLowerCase().replace('#', '')}`]);

                if (!checkChannel.length) {
                    return `${user['username']}, I'm not logging the channel you specified :/`;
                }

                let latestEmotes = await utils.query(`
                    SELECT *
                    FROM emotes
                    WHERE channel=?
                    ORDER BY date
                    DESC`,
                    [msg[0].toLowerCase().replace('#', '')]);

                if (findParam.length) {
                    latestEmotes = await utils.query(`
                        SELECT *
                        FROM emotes
                        WHERE channel=? AND type=?
                        ORDER BY date
                        DESC`,
                        [msg[0].toLowerCase().replace('#', ''), findParam[0].replace(/-/g, "")]);
                }

                if (!latestEmotes.length) {
                    return `${user['username']}, this channel does not have any added emotes registered yet.`;
                }

                const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                const userNoPing = msg[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}");

                const emoteList = (emotes.join(', ').length > 430) ? emotes.join(', ').substring(0, 400) + ' (...)' : emotes.join(', ');

                return `${user['username']}, recently added ${type} emotes in channel ${userNoPing}: ${emoteList}`
            }

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

			let latestEmotes = await utils.query(`
				SELECT *
				FROM emotes
				WHERE channel=?
				ORDER BY date
				DESC`,
                [channel.replace('#', '')]);

            if (findParam.length) {
                latestEmotes = await utils.query(`
                    SELECT *
                    FROM emotes
                    WHERE channel=? AND type=?
                    ORDER BY date
                    DESC`,
                    [channel.replace('#', ''), findParam[0].replace(/-/g, "")]);
            }

            if (!latestEmotes.length) {
                return `${user['username']}, this channel does not have any added emotes registered yet.`;
            }

            const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

			return `${user['username']}, recently added ${type} emotes in this channel: ${emotes.join(', ')}`
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
