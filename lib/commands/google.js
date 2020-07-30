#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: prefix + 'google',
	aliases: null,
	description: `search google with provided query`,
	permission: 1,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {		
			if (await custom.checkPermissions(user['username'])<1) { 
				return '';
			}
			
			const msg = custom.getParam(message)

			if (!msg[0]) {
				return `${user['username']}, You have not provided any input FeelsDankMan`;
			}

			return encodeURI(`google.com/search?q=${msg.join(' ')}`);
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}