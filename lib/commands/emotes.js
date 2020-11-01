#!/usr/bin/env node
'use strict';

const got = require('got');
const custom = require('../utils/functions.js');

module.exports = {
	name: "kb emotes",
	invocation: async (channel, user, message, platform) => {
		try {
			const msg = (message.split(' ')[1].toLowerCase() === "removed") ? custom.getParam(message, 1) : custom.getParam(message);

            if (msg[0] === "list") {
                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }
                if (channel === "#forsen") {
                    return `${user['username']}, see full list of emotes: kunszg(dot)xyz/emotes?search=${channel.replace('#', '')}`;
                }
                return `${user['username']}, see full list of emotes: https://kunszg.xyz/emotes?search=${channel.replace('#', '')}`;
            }

			if (msg[0] === "yoink") {
                if (await custom.checkPermissions(user['username'])<1) {
                    return `${user['username']}, You don't have permissions to use this parameter :(`;
                }

                if (platform === "whisper") {
                    return "This usage is disabled on this platform";
                }

				const channelName = channel.replace('#', '')

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
                    return '';
                }

                if (bttvEmotes?.message ?? false) {
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


                // iterate through FFZ emotes
                // and check if any of the emotes doesn't exist in the set anymore
                for (let j=0; j<emotes.length; j++) {
                    if (emotes[j].emoteId != null) {
                        if (!ffzEmotes.sets[setId].emoticons.some(i => emotes[j].emoteId === (i.id))) {
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

                // iterate through BTTV emotes
                // and check if any of the emotes doesn't exist in the set anymore
                for (let j=0; j<emotes.length; j++) {
                    if (emotes[j].emoteId === null) {
                        if (!allBttvEmotes.some(i => emotes[j].url.replace('https://cdn.betterttv.net/emote/', '').replace('/1x', '') === (i.id))) {
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

                allBttvEmotes.map(i => checkForRepeatedEmotes(i.code, i.id, 'bttv'));
                ffzEmotes.sets[setId].emoticons.map(i => checkForRepeatedEmotes(i.name, i.id, 'ffz'));

                return `${user['username']}, done TriHard`;
			}

            const formatDate = (timestamp) => {
                const time = Date.now() - Date.parse(timestamp);

                const seconds = Number(time/1000);
                const month = Math.floor(seconds / (3600*24*30))
                const d = Math.floor(seconds % (3600*24) / 86400);
                const h = Math.floor(seconds % (3600*24) / 3600);
                const m = Math.floor(seconds % 3600 / 60);
                const s = Math.floor(seconds % 60);

                const moDisplay = month > 0 ? month + "mo " : "";
                const dDisplay = d > 0 ? d + "d " : "";
                const hDisplay = h > 0 ? h + "h " : "";
                const mDisplay = m > 0 ? m + "m " : "";
                const sDisplay = s > 0 ? s + "s " : "";

                if (time > 2592000000) {
                    return `${moDisplay}${dDisplay}${hDisplay} ago`;
                }
                if (time > 86400000) {
                    return `${dDisplay}${hDisplay}${mDisplay} ago`;
                }
                if (time > 3600000) {
                    return `${hDisplay}${mDisplay} ago`;
                }
                return `${mDisplay}${sDisplay} ago`;
            }

            if ((msg?.[0] ?? false) && (msg[0] === "removed")) {
                const userSpecifiedChannel = msg.filter(i => i.startsWith('#'));
                if (userSpecifiedChannel.length) {
                    // check if channel exists in the database
                    const checkChannel = await custom.doQuery(`
                        SHOW TABLES LIKE "logs_${userSpecifiedChannel[0].toLowerCase().replace('#', '')}"
                        `);

                    if (!checkChannel.length) {
                        return `${user['username']}, I'm not logging the channel you specified :/`;
                    }

                    const latestRemovedEmotes = await custom.doQuery(`
                        SELECT *
                        FROM emotes_removed
                        WHERE channel="${userSpecifiedChannel[0].toLowerCase().replace('#', '')}"
                        ORDER BY date
                        DESC
                        `);

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

                const latestRemovedEmotes = await custom.doQuery(`
                    SELECT *
                    FROM emotes_removed
                    WHERE channel="${channel.replace('#', '')}"
                    ORDER BY date
                    DESC
                    `);

                if (!latestRemovedEmotes.length) {
                    return `${user['username']}, this channel does not have any removed emotes registered in my database yet.`;
                }

                const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                return `${user['username']}, recently removed emotes in this channel: ${emotes.join(', ')}`
            }

            if (msg[0]) {
                // check if channel exists in the database
                const checkChannel = await custom.doQuery(`
                    SHOW TABLES LIKE "logs_${msg[0].toLowerCase().replace('#', '')}"
                    `);

                if (!checkChannel.length) {
                    return `${user['username']}, I'm not logging the channel you specified :/`;
                }

                const latestEmotes = await custom.doQuery(`
                    SELECT *
                    FROM emotes
                    WHERE channel="${msg[0].toLowerCase().replace('#', '')}"
                    ORDER BY date
                    DESC
                    `);

                const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

                const userNoPing = msg[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}");

                const emoteList = (emotes.join(', ').length > 430) ? emotes.join(', ').substring(0, 400) + ' (...)' : emotes.join(', ');

                return `${user['username']}, recently added emotes in channel ${userNoPing}: ${emoteList}`
            }

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

			const latestEmotes = await custom.doQuery(`
				SELECT *
				FROM emotes
				WHERE channel="${channel.replace('#', '')}"
				ORDER BY date
				DESC
				`);

            const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 6);

			return `${user['username']}, recently added emotes in this channel: ${emotes.join(', ')}`
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
