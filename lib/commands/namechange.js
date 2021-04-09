#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb namechange",
	invocation: async (channel, user, message) => {
		try {
            const msg = utils.getParam(message.toLowerCase());

            const username = !msg[0] ? user['username'] : msg[0].replace(/@|,/g, "").toLowerCase();

            this.userData = await utils.Get.user().byUsername(username);

            if (!this.userData.length) {
                return `${user['username']}, username was not found.`;
            }

            this.userData = await utils.Get.user().byId(this.userData[0].userId);

            const checkIfOptedOut = await utils.Get.user().optout("namechange", this.userData[0].userId, "userId")

            if (checkIfOptedOut.length && (user['user-id'] != this.userData[0].userId)) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

            if (this.userData.length < 2) {
                return `${user["username"]}, no name changes were found. (logs since April 2020)`;
            }

            let usernames = this.userData.map(i => i.username).join(" => ");

            if (usernames.length > 445) {
                usernames = usernames.split("").slice(0, 440).join("") + "...";
            }

            return `${user['username']}, name changes detected (${this.userData.length - 1}): ${usernames}`;
		} catch (err) {
			utils.errorLog(err)
			return '';
		}
	}
}