#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');
const kb = require('../handler.js').kb;
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "eval",
	aliases: null,
	description: `debugging command, permitted users only`,
	permission: 5,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			const pi = require('pi-number');
			const shell = require('child_process');

			if (await custom.checkPermissions(user['username'])<5) {
				return '';
			}

            if ((msg[0] + ' ' + msg[1]) === "ban #all") {
                const got = require('got');
                let activeChatters = await got(`https://tmi.twitch.tv/group/user/${channel.replace('#', '')}/chatters`).json();
                activeChatters = activeChatters.chatters.viewers.concat(activeChatters.chatters.vips);

                for (let i=0; i<activeChatters.length; i++) {
                    kb.say(channel, `/ban ${activeChatters[i]}`);
                }
                return `${activeChatters.length} users have been banned monkaS `;
            }

            if ((msg[0] + ' ' + msg[1]) === "unban #all") {
                const got = require('got');
                let activeChatters = await got(`https://tmi.twitch.tv/group/user/${channel.replace('#', '')}/chatters`).json();
                activeChatters = activeChatters.chatters.viewers.concat(activeChatters.chatters.vips);

                for (let i=0; i<activeChatters.length; i++) {
                    kb.say(channel, `/unban ${activeChatters[i]}`);
                }
                return `${activeChatters.length} users have been unbanned FeelsGoodMan`;
            }

			if (msg.join(" ").toLowerCase() === "return typeof supinic") {
				return "hackerman"
			}

			if (msg.join(" ").toLowerCase().includes("creds")) {
				return user['username'] + ', api key :/'
			}

			function sleep(milliseconds) {
				var start = new Date().getTime();
				for (var i = 0; i < 1e7; i++) {
					if ((new Date().getTime() - start) > milliseconds) {
						break;
					}
				}
			}

			const ev = await eval('(async () => {' + msg.join(" ") + '})()');
			console.log(ev)
			return String(ev);

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}