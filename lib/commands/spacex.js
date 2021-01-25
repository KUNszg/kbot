#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got')

module.exports = {
	name: "kb spacex",
	invocation: async (channel, user, message) => {
		try {
			const spacexNextLaunch = await got('https://api.spacexdata.com/v4/launches/next').json()
			const timeDiff = Math.abs(spacexNextLaunch.date_unix-Date.now()/1000);

            const rocket = await got(`https://api.spacexdata.com/v4/rockets/${spacexNextLaunch.rocket}`);
            const launchpad = await got(`https://api.spacexdata.com/v4/launchpads/${spacexNextLaunch.launchpad}`);

			return `Next rocket launch by SpaceX in ${custom.humanizeDuration(timeDiff)},
			rocket ${rocket.name}, mission ${spacexNextLaunch.name}, flight number ${spacexNextLaunch.flight_number},
			${launchpad.name} - ${launchpad.locality}, reddit campaign: ${spacexNextLaunch.links.reddit.campaign}`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}