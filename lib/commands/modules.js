#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const mysql = require('mysql2');

module.exports = {
	name: prefix + 'modules',
	aliases: null,
	description: `checks if all modules are alive --cooldown 5s`,
	permission: 0,
	cooldown: 5000,
	invocation: async (channel, user, message, args) => {
		try {		
			const getLoggerStatus = await custom.doQuery(`
				SELECT date
				FROM stats
				WHERE type="module" AND sha="logger" 
				`);
			const getRemindersStatus = await custom.doQuery(`
				SELECT date
				FROM stats
				WHERE type="module" AND sha="reminders" 
				`);
			const getApiStatus = await custom.doQuery(`
				SELECT date
				FROM stats
				WHERE type="module" AND sha="api" 
				`);

			let loggerStatus = ((Date.now()/1000) - (Date.parse(getLoggerStatus[0].date)/1000)<700) ? 'alive ✔️' : 'dead ❌';
			let remindersStatus = ((Date.now()/1000) - (Date.parse(getRemindersStatus[0].date)/1000)<700) ? 'alive ✔️' : 'dead ❌';
			let apiStatus = ((Date.now()/1000) - (Date.parse(getApiStatus[0].date)/1000)<40) ? 'alive ✔️' : 'dead ❌';

			return `${user['username']}, logger module is ${loggerStatus} | API handler module is ${apiStatus} | reminders handler module is ${remindersStatus}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}