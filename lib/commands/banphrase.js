#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');

module.exports = {
    name: "kb banphrase",
    invocation: async (channel, user, message, platform) => {
        try {
            if (await custom.checkPermissions(user['username'])<3) {
                return '';
            }

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

            // syntax check
            const msg = custom.getParam(message)

            if (!msg[0]) {
                return `${user['username']}, no parameter provided`;
            }

            // add banphrase
            if (msg[0] === "+") {
                this.msg = msg.join(' ').replace('+ ', '');
                // check for repeated inserts
                const checkRepeated = await custom.query(`
                    SELECT *
                    FROM internal_banphrases
                    WHERE banphrase=?`,
                    [this.msg]);

                if (checkRepeated.length != 0) {
                    return `${user['username']}, this banphrase already exists.`;
                }

                await custom.query(`
                    INSERT INTO internal_banphrases (banphrase, date)
                    VALUES (?, CURRENT_TIMESTAMP)`,
                    [this.msg]);

                const getID = await custom.query(`
                    SELECT *
                    FROM internal_banphrases
                    WHERE banphrase=?`,
                    [this.msg]);

                return `${user['username']}, successfully added a banphrase
                "${this.msg}" with ID ${getID[0].ID}.`;
            }

            // remove banphrase
            if (msg[0] === "del" || msg[0] === "-") {

                // check if banphrase exists
                const checkRepeated = await custom.query(`
                    SELECT *
                    FROM internal_banphrases
                    WHERE banphrase=?`,
                    [msg[1]]);

                if (!checkRepeated.length) {
                    return `${user['username']}, this banphrase doesn't exist.`;
                }

                await custom.query(`
                    DELETE FROM internal_banphrases
                    WHERE banphrase=?`,
                    [msg[1]])

                return `${user['username']}, successfully removed the banphrase.`;
            }

            return `${user['username']}, invalid parameter.`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`
        }
    }
}