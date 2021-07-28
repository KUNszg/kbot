#!/usr/bin/env node
'use strict';

const fs = require('fs');
const utils = require('../utils/utils.js');

module.exports = {
	name: "kb joemama",
	invocation: async (channel, user, message, platform) => {
		try {
			const msg = utils.getParam(message);

			// get data from file
			let jokeDataRaw = fs.readFileSync('./data/mom_jokes.json');

			// convert received buffer to human-readable
			jokeDataRaw = JSON.parse(jokeDataRaw).data;

			// get a random joke
			jokeDataRaw = utils.random(jokeDataRaw)

			// get a random emote from database
			const randomEmote = await utils.query(`
			 	SELECT *
			 	FROM emotes
			 	WHERE channel=?
			 	ORDER BY RAND()
			 	LIMIT 1`,
                [channel.replace('#', '')]);

			// check for . or ! at the end of string
			const patt = /[.|!]$/g;
			const response = patt.test(jokeDataRaw) ? jokeDataRaw.slice(0,-1) : jokeDataRaw;

            if (platform === "whisper") {
                return `${utils.lCase(response)}}`;
            }

            let username = user.username;

            if (msg[0]) {
          		const _user = await utils.Get.user().byUsername(msg[0].replace(/@|,/g, ''));

          		if (_user.length) {
	          		const checkIfOptedOut = await utils.query(`
	                    SELECT *
	                    FROM optout
	                    WHERE command=? AND username=?`,
	                    ["joemama", _user[0].username]);

	                if (checkIfOptedOut.length && (user.username != _user[0].username)) {
	                    return `${user.username}, that user has opted out from being a target of this command.`;
	                }

          			username = _user[0].username;
          		} 
            }

			return `${username}, ${utils.lCase(response)} ${randomEmote.length ? randomEmote[0].emote : 'LUL'}`;
		} catch (err) {
			utils.errorLog(err);
		}
	}
}