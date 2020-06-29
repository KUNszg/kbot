#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const joemama = require('../../data/joemama.js');

module.exports = {
	name: prefix + "joemama",
	aliases: null,
	description: `random "your mom" joke -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
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

            const result = joemama.split('').reverse()[0] === '.' ? joemama.split('').reverse().replace('.', '').reverse().join('') : joemama
			return `${user['username']}, ${custom.lCase(result)} ${emotesJoke}`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}