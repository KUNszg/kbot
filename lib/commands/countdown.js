#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb countdown",
    invocation: async (channel, user, message) => {
        try {
            const msg = custom.getParam(message);

            this.msg = msg[0].match(/[0-9]{1,}/g) ?? '';

            if (!this.msg) {
                return `${user['username']}, you have to provide time in seconds to generate result.`;
            }

            if (this.msg > 31556926) { // 1 year
                return `${user['username']}, value out of range, maximum value is 1 year`;
            }

            const seconds = Date.now()/1000 + Number(this.msg);

            const code = custom.genString();

            await custom.query(`
                INSERT INTO countdown (verifcode, seconds, username, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [code, seconds, user['username']]);

            if (channel === "#forsen") {
                return `${user['username']}, your countdown will end in ${custom.humanizeDuration(this.msg)}
                kunszg(dot)com/countdown?verifcode=${code}`;
            }
            return `${user['username']}, your countdown will end in ${custom.humanizeDuration(this.msg)}
            https://kunszg.com/countdown?verifcode=${code}`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}