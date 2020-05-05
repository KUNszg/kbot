#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: prefix + 'npm',
	aliases: null,
	description: `search npm website for packages --cooldown 5s`,
	permission: 1,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {		

			if (await custom.checkPermissions(user['username'])<1) { 
				return '';
			}
			
			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(' ')
				.splice(2)
				.filter(Boolean);

			if (!msg[0]) {
				return `${user['username']}, You have not provided any input FeelsDankMan`;
			}

			return  'https://' + encodeURI(`www.npmjs.com/search?q=${msg.join(' ')}`);
			
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}