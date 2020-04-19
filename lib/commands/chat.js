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
	no parameter will return error -- cooldown 1s`,
	permission: 0,
	cooldown: 4000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2);

			const fetch = require('node-fetch');
			const getResponse = await fetch(`
				${creds.chat} ${msg.join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
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

			if (user['username'] === "kunszg") {
			
				const cache = [];
				const cacheinit = ['hi'];
				async function second() {

					if (cacheinit.length != 0) {
						cache.push('how')
						cacheinit.length = 0;
					}
					const secondLoop = await fetch(`${creds.chat}${await cache[0].replace(/'/g, '').split(' ').join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
						.then(response => response.json());
					console.log(await secondLoop)
					cache.length = 0;
					await kb.kb.say('kunszg', 'B1: ' + await secondLoop.response.toString());
					await cache.push(await secondLoop.response.replace(/\?/g, ''));

					const firstLoop = await fetch(`${creds.chat}${cache[0].replace(/'/g, '').split(' ').join("+").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`)
						.then(response => response.json());
					console.log(await secondLoop)
					cache.length = 0;
					await kb.kb.say('kunszg', 'B1: ' + await firstLoop.response.toString());
					await cache.push(await firstLoop.response.replace(/\?/g, ''));
				}
				setInterval(()=>{second()}, 15000);
				
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