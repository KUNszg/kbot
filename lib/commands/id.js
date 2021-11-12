#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb id",
	invocation: async (channel, user, message) => {
		try {
			const msg = utils.getParam(message);

			if (!msg[0]) {
				const getSenderData = await utils.Get.user(user);

				if (!getSenderData.length) {
					return `${user['username']}, you are not being logged in my database.`;
				}

				const dateDiff = Math.abs((new Date()) - (new Date(getSenderData[0].added)));
				const dateToSec = (dateDiff/1000).toFixed(0);

				return `${user['username']}, Your ID in my user list is ${getSenderData[0].ID} and your Twitch ID is ${user["user-id"]}
				you were first seen by the bot ${utils.humanizeDuration(dateToSec)} ago in channel
				${getSenderData[0].firstSeen === "haxk" ? "[EXPUNGED]" :
				getSenderData[0].firstSeen.replace(/^(.{2})/, "$1\u{E0000}")}.`;
			}

            this.msg = msg[0].toLowerCase().replace(/@|,/g, '');

            const checkIfOptedOut = await utils.Get.user().optout("id", this.msg, "username");

            if (checkIfOptedOut.length && user['username'] != this.msg) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

			const getUserData = await utils.Get.user().byUsername(this.msg);

			if (!getUserData.length) {
				return `${user['username']}, that user does not exist in my database.`;
			}

			const dateDiff = Math.abs((new Date()) - (new Date(getUserData[0].added)))
			const dateToSec = (dateDiff/1000).toFixed(0)

			return `${user['username']}, ${getUserData[0].username.replace(/^(.{2})/, "$1\u{E0000}")}'s
			ID in my user list is ${getUserData[0].ID} and their Twitch ID is ${getUserData[0].userId}
			they were first seen by the bot ${utils.humanizeDuration(dateToSec)} ago
			in channel ${getUserData[0].firstSeen === "haxk" ? "[EXPUNGED]" :
			getUserData[0].firstSeen.replace(/^(.{2})/, "$1\u{E0000}")}.`;
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']}, ${err} FeelsDankMan !!!`
		}
	}
}
