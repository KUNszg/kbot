#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb commands",
	invocation: async (channel, user, args) => {
		try {
            if (channel === "#forsen") {
                return `${user['username']}, You can find current active commands at kunszg(dot)xyz/commands`;
            }
			return `${user['username']}, You can find current active commands at https://kunszg.xyz/commands`;

		} catch (err) {
			custom.errorLog(err.message)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}