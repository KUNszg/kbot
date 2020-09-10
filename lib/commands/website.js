#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
	name: "kb website",
	invocation: async (channel, user, message, args) => {
		try {
            if (channel === "#forsen") {
                return `${user['username']}, kunszg (dot) xyz`;
            }
            return `${user['username']}, https://kunszg.xyz/`;
		} catch (err) {
			custom.errorLog(err)
			return `${user['username']} ${err} FeelsDankMan !!!`;
		}
	}
}