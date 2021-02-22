#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb website",
	invocation: async (channel, user) => {
		try {
            if (channel === "#forsen") {
                return `${user['username']}, kunszg(dot)com`;
            }
            return `${user['username']}, https://kunszg.com/`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}