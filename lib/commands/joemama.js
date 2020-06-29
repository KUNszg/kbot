#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "joemama",
	aliases: null,
	description: `random "your mom" joke -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {
            const joemama = require('../../data/joemama.js').data;

            const result = joemama.split('\n');
            const random = result[Math.floor(Math.random() * result.length)];

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

            const response = random.split('').reverse()[0] === '.' ? random.split('').reverse().join('').replace('.', '').split('').reverse().join('') : random
			return `${user['username']}, ${custom.lCase(response)} ${emotesJoke}`;

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}