#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
	name: prefix + "spacex",
	aliases: null,
	description: `data from SpaceX about next launch rocket launch date, 
	mission and launch site -- cooldown 15s`,
	permission: 0,
	cooldown: 15000,
	invocation: async (channel, user, message, args) => {
		try {
			const SpacexApiWrapper = require("spacex-api-wrapper");
			const space = await SpacexApiWrapper.getNextLaunch();
			const date = await space.launch_date_utc;
			const diff = Math.abs(new Date() - new Date(date))
			const DifftoSeconds = (diff / 1000).toFixed(0);
			const toHours = (DifftoSeconds / 3600).toFixed(0);

			if (toHours > 72) {
				return `Next rocket launch by SpaceX in ${(toHours / 24).toFixed(0)} days, 
				rocket ${space.rocket.rocket_name}, mission ${space.mission_name}, 
				${space.launch_site.site_name_long}, reddit campaign: ${space.links.reddit_campaign}`;
			}
			return `Next rocket launch by SpaceX in ${custom.format(DifftoSeconds)}, rocket 
			${space.rocket.rocket_name}, mission ${space.mission_name}, 
			${space.launch_site.site_name_long}, reddit campaign: ${space.links.reddit_campaign}`;
			
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}