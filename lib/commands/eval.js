#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js');
const got = require('got');
const cache = new Set();

module.exports = {
	name: "kb eval",
	invocation: async (channel, user, message, platform) => {
		try {
			if (await utils.checkPermissions(user.username) < 5) {
				return '';
			}

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

			const msg = utils.getParam(message);
			const shell = require('child_process');

            if (msg[0] === "flag") {
                if (!msg[1]) {
                    return `${user.username}, nothing to flag provided.`;
                }

                if (!msg[2] || !msg[2].match(/\bbot\b|\buser\b/)) {
                    return `${user.username}, no flag provided`;
                }

                if (!msg[2].match(/\bbot\b|\buser\b/)) {
                    return `${user.username}, wrong flag provided`;
                }

                let findUser = await utils.Get.user().byUsername(msg[1]);

                if (!findUser.length) {
                    findUser = await got(`https://api.ivr.fi/twitch/resolve/${msg[1]}`).json();

                    if (findUser.status === 404) {
                        return `${user.username}, invalid user provided "${msg[1]}"`;
                    }

                    findUser.userId = findUser.id;
                    findUser.username = findUser.login;
                }
                else {
                    findUser = findUser[0];
                }

                const checkIfExists = await utils.query(`
                    SELECT *
                    FROM logger_ignore_list
                    WHERE userId=?`, [findUser.userId]);

                if (checkIfExists.length) {
                    return `${user.username}, user is already being ignored by logger.`;
                }

                await utils.query(`
                    INSERT INTO logger_ignore_list (userId, username, type)
                    VALUES (?, ? ,?)`, [findUser.userId, findUser.username, msg[2]]);

                return `${user.username}, successfully flagged user ${findUser.username} (${findUser.userId}) as ${msg[2]}`;
            }

            if ((msg[0] + ' ' + msg[1]) === "ban #all") {
                let activeChatters = await got(`https://tmi.twitch.tv/group/user/${channel.replace('#', '')}/chatters`).json();
                activeChatters = activeChatters.chatters.viewers.concat(activeChatters.chatters.vips);

                for (let i=0; i<activeChatters.length; i++) {
                    kb.say(channel, `/ban ${activeChatters[i].toLowerCase() === "supibot" ? "" : activeChatters[i]}`);
                }
                return `${activeChatters.length} users have been banned monkaS `;
            }

            if ((msg[0] + ' ' + msg[1]) === "unban #all") {
                let activeChatters = await got(`https://tmi.twitch.tv/group/user/${channel.replace('#', '')}/chatters`).json();
                activeChatters = activeChatters.chatters.viewers.concat(activeChatters.chatters.vips);

                for (let i=0; i<activeChatters.length; i++) {
                    kb.say(channel, `/unban ${activeChatters[i].toLowerCase() === "supibot" ? "" : activeChatters[i]}`);
                }
                return `${activeChatters.length} users have been unbanned FeelsGoodMan`;
            }

			if (msg.join(" ").toLowerCase() === "return typeof supinic") {
				return "hackerman"
			}
            
			const sleep = (milliseconds) => {
				var start = new Date().getTime();
				for (var i = 0; i < 1e7; i++) {
					if ((new Date().getTime() - start) > milliseconds) {
						break;
					}
				}
			}

			const ev = await eval('(async () => {' + msg.join(" ") + '})()');

			return String(ev);
		} catch (err) {
			utils.errorLog(err)
			return `${user.username}, ${err} FeelsDankMan !!!`;
		}
	}
}