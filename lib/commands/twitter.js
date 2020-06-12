#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "twitter",
	aliases: null,
	description: `syntax: kb twitter [account] | no parameter - returns an error |
	account - returns latest tweet from specified user -- cooldown 8s`,
	permission: 0,
	cooldown: 6000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2);

			const fetchUrl = require("fetch").fetchUrl;
			const tweet = await new Promise((resolve, reject) => {
				fetchUrl(creds.twitter + msg[0] + '?howlong', (error, meta, body) => {
					if (error) {
						reject(error)
					} else {
						resolve(body.toString())
					}
				})
			});

			if (!msg[0]) {
				return `${user['username']}, no account	name provided, see "kb help twitter" for explanation`;
			}
			return `${user['username']}, ${tweet.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')}`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
		}
	}
}