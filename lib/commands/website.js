#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
	name: "kb website",
	invocation: async (channel, user) => {
		try {
            if (channel === "#forsen") {
                return `${user['username']}, kunszg(dot)com`;
            }
            return `${user['username']}, https://kunszg.com/`;
		} catch (err) {
			utils.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}