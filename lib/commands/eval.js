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
			if (await utils.checkPermissions(user.username)<5) {
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

			if (msg.join(" ").toLowerCase().includes("creds")) {
				return user.username + ', api key :/'
			}

			const sleep = (milliseconds) => {
				var start = new Date().getTime();
				for (var i = 0; i < 1e7; i++) {
					if ((new Date().getTime() - start) > milliseconds) {
						break;
					}
				}
			}

            const Tmi = {
                send: async function (channel, message, opts) {
                    this.opts = {
                        "bypass": false,
                        "whisper": false,
                        "action": false,
                        "ban": false,
                        "banMessage": "no message",
                        "timeout": false,
                        "timeoutDuration": 1,
                        "timeoutReason": "no message",
                        "user": false
                    }

                    if (opts) {
                        Object.assign(this.opts, opts);
                    }

                    const repeatedMessages = () => {
                        let data = {
                            "channel": channel,
                            "message": message,
                        };

                        let lastItem = [...cache].filter(i => i.channel === data.channel);

                        if (lastItem.length > 0) {
                            lastItem = lastItem[lastItem.length - 1];

                            if (lastItem.message.replace("\u{E0000}", "") === data.message && lastItem.channel === data.channel) {
                                lastItem.message.endsWith("\u{E0000}") ? data.message = data.message.replace(/\u{E0000}$/u, "") : data.message += "\u{E0000}";
                            }
                        }

                        cache.add(data);

                        setTimeout(() => {
                            cache.delete(data);
                        }, 30000);

                        return data;
                    }

                    if (this.opts.bypass || this.opts.action || !opts) {
                        message = repeatedMessages().message;
                    }

                    if (!this.opts.bypass && !opts) {
                        if (await this.banphraseCheck(channel, message)) {
                            if (this.opts.user) {
                                kb.say(channel, `${this.opts.user.username}, the result is banphrased, I whispered it to you tho cmonBruh`).catch(err => {});
                                kb.whisper(this.opts.user.username, message).catch(err => {});
                            } else {
                                kb.say(channel, "the result is banphrased cmonBruh").catch(err => {});
                            }
                        } else {
                            kb.say(channel, message).catch(err => {});
                        }
                    }

                    if (this.opts.bypass) {
                        this.opts.action ? kb.action(channel, message).catch(err => {}) : kb.say(channel, message).catch(err => {});
                    }

                    if (this.opts.whisper) {
                        // username, message
                        kb.whisper(channel, message).catch(err => {});
                    }

                    if (this.opts.action && !this.opts.bypass) {
                        if (await this.banphraseCheck(channel, message)) {
                            if (this.opts.user) {
                                kb.action(channel, `${this.opts.user.username}, the result is banphrased, I whispered it to you tho cmonBruh`).catch(err => {});
                                kb.whisper(this.opts.user.username, message).catch(err => {});
                            } else {
                                kb.action(channel, "the result is banphrased cmonBruh").catch(err => {});
                            }
                        } else {
                            kb.action(channel, message).catch(err => {});
                        }
                    }

                    if (this.opts.ban) {
                        // channel, username, message
                        kb.ban(channel, message, this.opts.banMessage).catch(err => {});
                    }

                    if (this.opts.timeout) {
                        // channel, username, duration, reason
                        kb.timeout(channel, message, this.opts.timeoutDuration, this.opts.timeoutReason).catch(err => {});
                    }
                    return "";
                },

                banphraseCheck: async function (channel, message) {
                    const test = await utils.banphrasePass(message, channel.replace('#', ''));
                    if (test.banned && utils.strictChannels(channel)) {
                        if (!utils.ignore(channel)) {
                            return false;
                        }
                        return true;
                    }
                    return false;
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