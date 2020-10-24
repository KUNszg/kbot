#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got')

module.exports = {
	name: "kb spacex",
	invocation: async (channel, user, message) => {
		try {
			const spacex = await got('https://api.spacexdata.com/v3/launches/next').json()
			const timeDiff = spacex.launch_date_unix-Date.now()/1000;

			return `Next rocket launch by SpaceX in ${(custom.secondsToDhms(timeDiff))},
			rocket ${spacex.rocket.rocket_name}, mission ${spacex.mission_name},
			${spacex.launch_site.site_name_long}, reddit campaign: ${spacex.links.reddit_campaign}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}