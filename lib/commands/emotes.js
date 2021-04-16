#!/usr/bin/env node
'use strict';

const got = require('got');
const utils = require('../utils/utils.js');

let cache = [];

// delete entry from cache if existance exceeds 4 hours
setInterval(() => {
    const allKeys = cache.map(i => Object.keys(i)).flat(); // get all keys of objects in cache


    for (let k = 0; k < allKeys.length; k++) {
        const foundObject = allKeys.map(j => cache.find(i => i[j]))[0];

        cache = cache.filter(i => i !== null).filter(i => typeof i !== "undefined"); // remove malformed entries

        const keys = Object.keys(foundObject);
        const timestamp = foundObject[keys][0].timestamp;

        if ((Date.now() - timestamp) > 14400000) {
            cache = cache.filter(i => i !== foundObject)
        }
    }
}, 300000); // every 5 minutes

module.exports = {
	name: "kb emotes",
	invocation: async (channel, user, message, platform) => {
		try {
            this.message = message.split(' ')[1].toLowerCase();
            this.message = this.message.replace(/\bemotesearch\b|\bes\b/g, "emote");

			const msg = (this.message=== "removed") || (this.message === "emote") ? utils.getParam(message, 1) : utils.getParam(message);

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

                return `${user['username']}, //FFZ https://api.frankerfacez.com/v1/room/id/${userId[0].userId} //BTTV https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}`;
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

                const ffzEmotes = await got(`https://api.frankerfacez.com/v1/room/id/${userId[0].userId}`).json();

                const bttvEmotes = await got(`https://api.betterttv.net/3/cached/users/twitch/${userId[0].userId}`).json();

                if (ffzEmotes?.error ?? false) {
                    return '';
                }

                if (bttvEmotes?.message ?? false) {
                    return '';
                }

                if (!ffzEmotes) {
                    return '';
                }

                if (!bttvEmotes) {
                    return '';
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

                            await utils.query(`
                                INSERT INTO emotes (channel, emote, url, type, date)
                                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                                [channelName, emote, emoteLink, type]);
                        }
                    }

                    if (type === "ffz") {
                        const updateEmotes = emotes.find(i => i.emoteId === id);
                        if (!updateEmotes) {
                            const findEmote = ffzEmotes.sets[setId].emoticons.filter(i => i.id === id);

                            await utils.query(`
                                INSERT INTO emotes (channel, emote, url, emoteId, type, date)
                                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                                [channelName, emote, findEmote[0].urls["1"], type]);
                        }
                    }

                }

                // iterate through BTTV emotes
                // and check if any of the emotes doesn't exist in the set anymore
                for (let j=0; j<emotes.length; j++) {
                    if (emotes[j].emoteId === null) {
                        if (!allBttvEmotes.some(i => emotes[j].url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === (i.id))) {
                            await utils.query(`
                                DELETE FROM emotes
                                WHERE ID=?`,
                                [emotes[j].ID]);

                            await utils.query(`
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
                            await utils.query(`
                                DELETE FROM emotes
                                WHERE ID=?`,
                                [emotes[j].ID]);

                            await utils.query(`
                                INSERT INTO emotes_removed (channel, emote, url, emoteId, date, type)
                                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, "ffz",)`,
                                [channelName, emotes[j].emote, emotes[j].url, emotes[j].emoteId]);
                        }
                    }
                }

                allBttvEmotes.map(i => checkForRepeatedEmotes(i.code, i.id, 'bttv'));
                ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotes(i.name, i.id, 'ffz'));

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

            if ((msg?.[0] ?? false) && (this.message === "emote")) {
                if (!msg[1]) {
                    return `${user['username']}, you have to provide an emote to search for.`;
                }

                this.userMsg = msg.filter(i => !i.match(/i:\[?(\d+)\]?/))[1];

                if (this.userMsg.length < 3) {
                    return `${user['username']}, too little characters provided.`;
                }

                if (!cache.filter(i => i[this.userMsg]).length) {
                    const emotesCurr = await utils.query(`
                        SELECT DISTINCT url, emoteId, type, emote
                        FROM emotes
                        WHERE url IS NOT NULL AND emote=? AND type="ffz"
                        ORDER BY DATE desc`, [this.userMsg]);

                    const emotesRem = await utils.query(`
                        SELECT DISTINCT url, emoteId, type, emote
                        FROM emotes_removed
                        WHERE url IS NOT NULL AND emote=? AND type="ffz"`, [this.userMsg]);

                    const emotesBttvApi = [];

                    for (let limit = 100, offset = 0; offset<1500;) {
                        const list = await got(encodeURI(`https://api.betterttv.net/3/emotes/shared/search?query=${this.userMsg}&offset=${offset}&limit=${limit}`)).json();

                        if (list.length) {
                            emotesBttvApi.push(list);
                            offset += 100;
                        } else {
                            break;
                        }
                    }

                    const _emotesBttvApi = emotesBttvApi.flat();

                    this.bttvEmoteSet = _emotesBttvApi.map(i => `https://betterttv.com/emotes/${i.id}`);

                    const emoteSets = emotesCurr.concat(emotesRem);

                    this.ffzEmoteSet = emoteSets.filter(i => i.url != null).map(i => `https://www.frankerfacez.com/emoticon/${i.emoteId}-${i.emote}`)

                    this.platform = msg.find(i => i.match(/\b(-)?(ffz|bttv)\b/i));

                    this.emoteSets = this.bttvEmoteSet.concat(this.ffzEmoteSet);

                    const data = JSON.parse(
                        `{${JSON.stringify(this.userMsg)}: [{
                            "timestamp": ${Date.now()},
                            "bttv": ${JSON.stringify(this.bttvEmoteSet)},
                            "ffz": ${JSON.stringify(this.ffzEmoteSet)},
                            "emoteSets": ${JSON.stringify(this.emoteSets)}
                        }]}`);

                    cache.push(data);
                }

                this.filter = cache.filter(i => i[this.userMsg])[0][this.userMsg][0];

                this.ffzEmoteSet = this.filter.ffz;
                this.bttvEmoteSet = this.filter.bttv;
                this.emoteSets = this.filter.emoteSets;

                if (!this.emoteSets.length) {
                    return `${user['username']}, no emotes were found.`;
                }

                const results = () => {
                    if (this.platform) {
                        if (this.platform.toLowerCase().replace("-", "") === "bttv") {
                            return this.bttvEmoteSet.length;
                        }
                        return this.ffzEmoteSet.length;
                    }
                    return this.emoteSets.length;
                }

                const emote = (index) => {
                    if (this.platform) {
                        if (this.platform.toLowerCase().replace("-", "") === "bttv") {
                            return this.bttvEmoteSet[index];
                        }
                        return this.ffzEmoteSet[index];
                    }
                    return this.emoteSets[index];
                }

                if (msg.join(' ').match(/i:\[?(\d+)\]?/)) {
                    this.index = msg.join(' ').match(/i:\[?(\d+)\]?/)[0].replace(/i:|\[|\]/g, '');

                    if (typeof this.emoteSets[Number(this.index)] === "undefined") {
                        return `${user['username']}, this index does not exist.`;
                    }

                    return `${user['username']}, i:${this.index} : ${emote(this.index)} `;
                }

                if (this.emoteSets.length > 1) {
                    return `${user['username']}, ${results()} results found, use i:[number] as parameter to get them. i:0 : ${emote(0)}`;
                }

                return `${user['username']}, ${emote(0)}`;
            }

            if ((msg?.[0] ?? false) && (msg[0] === "removed")) {
                const userSpecifiedChannel = msg.filter(i => i.startsWith('#'));
                if (userSpecifiedChannel.length) {
                    // check if channel exists in the database
                    const checkChannel = await utils.query("SHOW TABLES LIKE ?", [`logs_${userSpecifiedChannel[0].toLowerCase().replace('#', '')}`]);

                    if (!checkChannel.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }

                    const latestRemovedEmotes = await utils.query(`
                        SELECT *
                        FROM emotes_removed
                        WHERE channel=?
                        ORDER BY date
                        DESC`,
                        [userSpecifiedChannel[0].toLowerCase().replace('#', '')]);

                    if (!latestRemovedEmotes.length) {
                        return `${user['username']}, this channel does not have any removed emotes registered in my database yet.`;
                    }

                    const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);
                    const userNoPing = userSpecifiedChannel[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}")

                    return `${user['username']}, recently removed emotes in channel ${userNoPing}: ${emotes.join(', ')}`
                }

                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }

                const latestRemovedEmotes = await utils.query(`
                    SELECT *
                    FROM emotes_removed
                    WHERE channel=?
                    ORDER BY date
                    DESC`,
                    [channel.replace('#', '')]);

                if (!latestRemovedEmotes.length) {
                    return `${user['username']}, this channel does not have any removed emotes registered in my database yet.`;
                }

                const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                return `${user['username']}, recently removed emotes in this channel: ${emotes.join(', ')}`
            }

            if (msg[0]) {
                // check if channel exists in the database
                const checkChannel = await utils.query("SHOW TABLES LIKE ?", [`logs_${msg[0].toLowerCase().replace('#', '')}`]);

                if (!checkChannel.length) {
                    return `${user['username']}, I'm not logging the channel you specified :/`;
                }

                const latestEmotes = await utils.query(`
                    SELECT *
                    FROM emotes
                    WHERE channel=?
                    ORDER BY date
                    DESC`,
                    [msg[0].toLowerCase().replace('#', '')]);

                const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                const userNoPing = msg[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}");

                const emoteList = (emotes.join(', ').length > 430) ? emotes.join(', ').substring(0, 400) + ' (...)' : emotes.join(', ');

                return `${user['username']}, recently added emotes in channel ${userNoPing}: ${emoteList}`
            }

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

			const latestEmotes = await utils.query(`
				SELECT *
				FROM emotes
				WHERE channel=?
				ORDER BY date
				DESC`,
                [channel.replace('#', '')]);

            const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

			return `${user['username']}, recently added emotes in this channel: ${emotes.join(', ')}`
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
