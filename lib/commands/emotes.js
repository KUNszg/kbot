#!/usr/bin/env node
'use strict';

const got = require('got');
const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;

module.exports = {
	name: "kb emotes",
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

            if (msg[0] === "list") {
                if (channel === "#forsen") {
                    return `${user['username']}, see full list of emotes: kunszg(dot)xyz/emotes`;
                }
                return `${user['username']}, see full list of emotes: https://kunszg.xyz/emotes`;
            }

			if (msg[0] === "yoink") {
                if (await custom.checkPermissions(user['username'])<1) {
                    return `${user['username']}, You don't have permissions to use this parameter :(`;
                }

				const channelParsed = channel.replace('#', '')

				const emotes = await custom.doQuery(`
					SELECT *
				 	FROM emotes
				 	WHERE channel="${channelParsed}"
				 	`);

				// get BTTV emotes from current channel
				// eventually swap to this https://obote.herokuapp.com/api/emotes/?channel=CHANNEL
				let channelBTTVEmotes = await got(`https://decapi.me/bttv/emotes/${channelParsed}`);

				// get FFZ emotes form current channel
				let channelFFZEmotes = await got(`https://decapi.me/ffz/emotes/${channelParsed}`);

				channelBTTVEmotes = String(channelBTTVEmotes.body).split(' ');
				channelFFZEmotes = String(channelFFZEmotes.body).split(' ');

				kb.say(channel, `${user['username']}, done TriHard`);

				if (channelBTTVEmotes.includes("Unable to") || channelFFZEmotes.includes("Unable to")) {
					return '';
				}

				const checkForRepeatedEmotes = (emote, type) => {
					const updateEmotes = emotes.find(i => i.emote === emote);
					if (!updateEmotes) {
						custom.doQuery(`
							INSERT INTO emotes (channel, emote, date, type)
							VALUES ("${channelParsed}", "${emote}", CURRENT_TIMESTAMP, "${type}")
							`);
					}
				}

				channelBTTVEmotes.map(i => checkForRepeatedEmotes(i, 'bttv'));
				channelFFZEmotes.map(i => checkForRepeatedEmotes(i, 'ffz'));

				const allEmotes = channelBTTVEmotes.concat(channelFFZEmotes);
				const checkIfStillExists = emotes.filter(i => !allEmotes.includes(i.emote));

				if (!checkIfStillExists.length) {
					return '';
				}

				for (let i=0; i<checkIfStillExists.length; i++) {
					await custom.doQuery(`
						DELETE FROM emotes
						WHERE channel="${channelParsed}" AND emote="${checkIfStillExists[i].emote}"
						`);

                    await custom.doQuery(`
                        INSERT INTO emotes_removed (channel, emote, date, type)
                        VALUES ("${channel.replace('#', '')}", "${checkIfStillExists[i].emote}", CURRENT_TIMESTAMP, "${checkIfStillExists[i].type}")
                        `)
				}
				return '';
			}

            const formatDate = (timestamp) => {
                const time = Date.now() - Date.parse(timestamp);
                // convert to days
                if(time > 172800000) {
                    return `${custom.secondsToDhm(time/1000)} ago`;
                }
                // convert to hours
                return `${custom.format(time/1000)} ago`
            }

            if (msg.some(i => i.includes("removed"))) {
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

                const emotes = latestRemovedEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 7);

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

                const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 7);

                const userNoPing = msg[0].toLowerCase().replace('#', '').replace(/^(.{2})/, "$1\u{E0000}");

                const emoteList = (emotes.join(', ').length > 430) ? emotes.join(', ').substring(0, 400) + ' (...)' : emotes.join(', ');

                return `${user['username']}, recently added emotes in channel ${userNoPing}: ${emoteList}`
            }

			const latestEmotes = await custom.doQuery(`
				SELECT *
				FROM emotes
				WHERE channel="${channel.replace('#', '')}"
				ORDER BY date
				DESC
				`);

            const emotes = latestEmotes.map(i => `${i.emote} (${formatDate(i.date)})`).slice(0, 7);

			return `${user['username']}, recently added emotes in this channel: ${emotes.join(', ')}`
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}
