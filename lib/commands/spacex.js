#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const got = require('got')

module.exports = {
	name: prefix + "spacex",
	aliases: null,
	description: `data from SpaceX about next rocket launch date, 
	mission data and launch site`,
	permission: 0,
	cooldown: 15000,
	invocation: async (channel, user, message, args) => {
		try {
			const spacex = await got('https://api.spacexdata.com/v3/launches/next').json()
			const timeDiff = Date.now()/1000 - spacex.launch_date_unix;

			return `Next rocket launch by SpaceX in ${(custom.secondsToDhms(timeDiff))}, 
			rocket ${spacex.rocket.rocket_name}, mission ${spacex.mission_name}, 
			${spacex.launch_site.site_name_long}, reddit campaign: ${spacex.links.reddit_campaign}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}