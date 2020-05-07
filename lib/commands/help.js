#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "help",
	aliases: null,
	description: `syntax: kb help [command] | no parameter - shows basic information about bot,
	it's owner and host | command - shows description of a specified command -- cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.toLowerCase()
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);

			const requireDir = require('require-dir');
			const commands = requireDir('./');

			// if there is no parameter given, return basic command message
			if (!msg[0]) {
				return `${user['username']}, kunszgbot is owned by KUNszg, sponsored by 
				${'Leppunen'.replace(/^(.{2})/, "$1\u{E0000}")}, Node JS ${process.version}, running on 
				Ubuntu 19.10 GNU/${process.platform} ${process.arch}, for commands list use 'kb commands'.`;
			} 

			if (msg[0] === "help") {
				return `${user['username']}, syntax: kb help [command] | no parameter - shows basic 
				information about bot, it's owner and host | command - shows description 
				of a specified command -- cooldown 5s`;
			}

			if (typeof commands[message.split(' ')[2]] === "undefined") {
				return `${user['username']}, this command does not exist.`;
			}
			if (!commands[message.split(' ')[2]].description) {
				return `${user['username']}, this command does not have a description.`;
			}

			if (channel!="#forsen") {
				return `${user['username']}, ${commands[message.split(' ')[2]].description}`;
			}

			if (commands[message.split(' ')[2]]?.description_formatted ?? false) {
				return `${user['username']}, ${commands[message.split(' ')[2]].description_formatted}`;
			}
			return `${user['username']}, ${commands[message.split(' ')[2]].description}`

			// if something else that is not handled happens, throw an error
			throw 'internal error monkaS';
		
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}