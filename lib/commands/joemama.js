#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "joemama",
	aliases: null,
	description: `random "your mom" joke -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			const fetchUrl = require("fetch").fetchUrl;
			const joemama = await new Promise((resolve, reject) => {
				fetchUrl(creds.joemama, function(error, meta, body) {
					if (error) {
						console.log(error);
						reject(error)
					} else {
						resolve(body.toString())
					}
				})
			});
			const laughingEmotes = [
				' 😬',
				' 4Head',
				' 4HEad',
				' ArgieB8',
				' FreakinStinkin',
				' AlienPls',
				' 🔥',
				' FireSpeed',
				' ConcernDoge',
				' haHAA',
				' CruW',
				' :O',
				' >(',
				' OMEGALUL',
				' LULW',
				' CurseLit',
				' 😂'
			]
			const emotesJoke = laughingEmotes[Math.floor(Math.random() * laughingEmotes.length)]

			return `${user['username']}, ${custom.lCase(joemama.split('"')[3])} ${emotesJoke}`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}