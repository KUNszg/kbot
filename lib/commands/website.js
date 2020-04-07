#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "website",
	aliases: null,
	description: `link to my project's website`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			return `${user['username']}, https://kunszg.xyz/`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}