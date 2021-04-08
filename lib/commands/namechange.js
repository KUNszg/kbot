#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb namechange",
	invocation: async (channel, user, message) => {
		try {
            const msg = utils.getParam(message.toLowerCase());

            const username = !msg[0] ? user['username'] : msg[0].replace(/@|,/g, "").toLowerCase();

            const checkIfOptedOut = await utils.query(`
                SELECT *
                FROM optout
                WHERE command=? AND username=?`,
                ["namechange", username]);

            if (checkIfOptedOut.length && (user['username'] != username)) {
                return `${user['username']}, that user has opted out from being a target of this command.`;
            }

            this.userData = await utils.Get.user().byUsername(username);

            if (!this.userData.length) {
                return `${user['username']}, username was not found.`;
            }

            this.userData = await utils.Get.user().byId(this.userData[0].userId);

            if (this.userData.length < 2) {
                return `${user["username"]}, no name changes were found. (logs since April 2020)`;
            }

            let usernames = this.userData.map(i => i.username).join(" => ");

            if (usernames.length > 445) {
                usernames = usernames.split("").slice(0, 440) + "...";
            }

            return `${user['username']}, name changes detected (${this.userData.length}): ${usernames}`;
		} catch (err) {
			utils.errorLog(err)
			return '';
		}
	}
}