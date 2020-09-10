#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb rf",
	invocation: async (channel, user, message, args) => {
		try {
			const got = require('got');

			if (channel === "#kiansly") {
				const res = await got('https://uselessfacts.jsph.pl/random.json?language=de').json();
				return `${user['username']}, ${res.text.toLowerCase()} 🤔`;
			}

			const res = await got('https://uselessfacts.jsph.pl/random.json?language=en').json();
			return `${user['username']}, ${res.text.toLowerCase()} 🤔`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}