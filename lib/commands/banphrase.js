#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');

module.exports = {
    name: prefix + "banphrase",
    aliases: null,
    permission: 3,
    description: 'add or remove banphrase - (+, -, add, del) -- cooldown 10ms',
    invocation: async (channel, user, message, args) => {
        try {
            if (await custom.checkPermissions(user['username'])<3) {
                return '';
            }

            // syntax check
            const msg = custom.getParam(message)

            if (!msg[0]) {
                return `${user['username']}, no parameter provided`;
            }

            // add banphrase
            if (msg[0] === "+") {

                // check for repeated inserts
                const checkRepeated = await custom.doQuery(`
                    SELECT * FROM internal_banphrases
                    WHERE banphrase="${msg.join(' ').replace('+ ', '')}"
                    `);

                if (checkRepeated.length != 0) {
                    return `${user['username']}, this banphrase already exists.`;
                }

                await custom.doQuery(`
                    INSERT INTO internal_banphrases (banphrase, date)
                    VALUES ("${msg.join(' ').replace('+ ', '')}", CURRENT_TIMESTAMP)
                    `);

                const getID = await custom.doQuery(`
                    SELECT * FROM internal_banphrases
                    WHERE banphrase="${msg.join(' ').replace('+ ', '')}"
                    `);

                return `${user['username']}, successfully added a banphrase
                "${msg.join(' ').replace('+ ', '')}" with ID ${getID[0].ID}.`;
            }

            // remove banphrase
            if (msg[0] === "del" || msg[0] === "-") {

                // check if banphrase exists
                const checkRepeated = await custom.doQuery(`
                    SELECT * FROM internal_banphrases
                    WHERE banphrase="${msg[1]}"
                    `);

                if (!checkRepeated.length) {
                    return `${user['username']}, this banphrase doesn't exist.`;
                }

                await custom.doQuery(`
                    DELETE FROM internal_banphrases
                    WHERE banphrase="${msg[1]}"
                    `)

                return `${user['username']}, successfully removed the banphrase.`;
            }

            return `${user['username']}, invalid parameter.`;

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`
        }
    }
}