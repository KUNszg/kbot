#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got');

module.exports = {
	name: "kb hosts",
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			const hosts = await got(`https://decapi.me/twitch/hosts/${!msg[0] ? channel.replace('#', '') : msg[0]}`).json()

            if (!hosts.length) {
                return `${user['username']}, this channel is not being hosted by any user.`;
            }

            return `${user['username']}, channel ${((!msg[0]) ? channel.replace('#', '') : msg[0]).replace(/^(.{2})/, "$1\u{E0000}")} is being hosted by ${hosts.length} user(s).`;
		} catch (err) {
			custom.errorLog(err)
            return `${user['username']}, ${err} monkaS`
		}
	}
}