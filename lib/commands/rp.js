#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const fetch = require('node-fetch');

module.exports = {
	name: prefix + "rp",
	aliases: null,
	permission: 'restricted',
	description: `interaction command with Supibot's $ps command, 
	sends a random playsound to appear on stream -- cooldown 5s`,
	permission: 5,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			const playsound = await fetch("https://supinic.com/api/bot/playsound/list")
				.then(response => response.json());

			const randomPs = playsound.data.playsounds[
				Math.floor(Math.random()*playsound.data.playsounds.length)
				]

			if (channel === "#supinic") {
				return `$ps ${randomPs.name}`;
			}
			return "";

		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}