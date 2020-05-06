#!/usr/bin/env node
'use strict';s

const custom = require('../utils/functions.js');
const bot = require('../handler.js');
const creds = require('../credentials/config.js');
const fetch = require('node-fetch');
const prefix = "kb ";

module.exports = {
	name: prefix + '4Head',
	aliases: prefix + '4head',
	description: `says a random joke related to programming or other stuff -- cooldown 4s`,
	permission: 0,
	cooldown: 4000,
	invocation: async (channel, user, message, args) => {
		try {

			const arr = [
				'general',
				'programming'
			];
		
			const randomPs = arr[
				Math.floor(Math.random() * arr.length)
				];
			if (randomPs === 'programming') {
				const joke = await fetch(creds.joke1)
					.then(response => response.json());

				setTimeout(() => {
					bot.kb.say(channel, `${custom.lCase(joke[0].punchline.replace(/\./g, ''))} 4HEad`)
				}, 3000);

				return `${user['username']}, ${custom.lCase(joke[0].setup)}`;
			} 
			if (randomPs === 'general') {
				const jokeGeneral = await fetch(creds.joke2)
					.then(response => response.json());

				setTimeout(() => {
					bot.kb.say(channel, `${custom.lCase(jokeGeneral.punchline.replace(/\./g, ''))} 4HEad`)
				}, 3000);	
				return `${user['username']}, ${custom.lCase(jokeGeneral.setup)}`;
			}

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}
