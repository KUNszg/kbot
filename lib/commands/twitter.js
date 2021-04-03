#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb twitter",
	invocation: async (channel, user, message) => {
		try {
			const msg = utils.getParam(message);

			const got = require('got');
			const tweet = await got(`https://decapi.me/twitter/latest/${msg[0]}?howlong`);

			if (!msg[0]) {
				return `${user['username']}, no account	name provided, see "kb help twitter" for explanation`;
			}
			return `${user['username']}, ${tweet.body.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')}`;
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, error FeelsDankMan !!!`;
		}
	}
}