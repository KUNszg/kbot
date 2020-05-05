#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js');
const kb = require('../handler.js');

module.exports = {
	name: prefix + "chat",
	aliases: prefix + "ct",
	description: `syntax: kb chat [message] | message - provide a message to chat with the AI bot, 
	no parameter will return error -- cooldown 10s`,
	permission: 0,
	cooldown: 10000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2)
				.filter(Boolean)

			const fetch = require('node-fetch');
			const getResponse = await fetch(encodeURI(`${creds.chat} ${msg.join("+")}`))
				.then(response => response.json());

			if (!msg.join(" ")) {
				return `${user['username']}, please provide a text for me to respond to :)`;
			}

			if (msg.includes("homeless")) {
				return `${user['username']}, just get a house 4House`;
			} 

			if (msg.includes("forsen")) {
				return `${user['username']}, maldsen LULW`;
			} 

			if (((getResponse.response.charAt(0).toLowerCase() + getResponse.response.slice(1))
				.replace(".", " 4Head ")
				.replace("?", "? :) ")
				.replace("ń", "n")
				.replace("!", "! :o ")) === ' '
			) {
				return `${user['username']}, [err CT1] - bad response monkaS`
			} 
			
			return `${user['username']}, ${(getResponse.response.charAt(0).toLowerCase() + 
				getResponse.response.slice(1))
				.replace(".", " 4Head ")
				.replace("?", "? :) ")
				.replace("ń", "n")
				.replace("!", "! :o ")}`;
			
		} catch (err) {
			if (err.message) {
				custom.errorLog(err.message)
				return `${user['username']}, an error occured while fetching data monkaS`;
			}
			custom.errorLog(err)
			return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
		}
	}
}