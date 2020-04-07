#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "rf",
	aliases: null,
	description: `random fact. Provides facts about random stuff -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			const fetch = require('node-fetch');
			const json = await fetch(creds.randomFact)
				.then(response => response.json());

			return `${user['username']}, ${json.text.toLowerCase()} 🤔`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}