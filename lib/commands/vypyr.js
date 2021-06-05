#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
    name: "kb vypyr",
    invocation: async (channel, user, message) => {
        try {
            const msg = utils.getParam(message);

            if (!isNaN(msg[0]) && !isNaN(msg[1]) && !isNaN(msg[2])) {
                await utils.query(`
                    INSERT INTO vypyr_execs (program, ctrlr, value)
                    VALUES (?, ?, ?)`, [msg[0], msg[1], msg[2]]);

                return "";
            }
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, error FeelsDankMan !!!`;
        }
    }
}