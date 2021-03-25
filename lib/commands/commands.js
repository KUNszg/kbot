#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb commands",
	invocation: async (channel, user) => {
		try {
            if (channel === "#forsen") {
                return `${user['username']}, You can find current active commands at kunszg(dot)com/commands`;
            }
			return `${user['username']}, You can find current active commands at https://kunszg.com/commands`;

		} catch (err) {
			utils.errorLog(err.message)
			return `${user['username']}, ${err} FeelsDankMan !!!`;
		}
	}
}