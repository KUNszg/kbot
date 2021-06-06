#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const controls = require('../../node_modules/vypyr-connector/controls.json');

module.exports = {
    name: "kb vypyr",
    invocation: async (channel, user, message) => {
        try {
            if (await utils.checkPermissions(user['username']) < 5) {
                return "";
            }

            const msg = utils.getParam(message);

            if (msg[0] === "save" && msg[1] && msg[2] && msg[3] && msg[4]) {
                await utils.query(`
                    INSERT INTO vypyr_presets (preset, program, ctrlr, value)
                    VALUES (?, ?, ?)`, [msg[1], msg[2], msg[3], msg[4]]);

                return "";
            }

            if (msg[0] === "use" && msg[1]) {
                const preset = await utils.query(`
                    SELECT *
                    FROM vypyr_presets
                    WHERE preset=?`, [msg[1]]);

                await utils.query(`
                    INSERT INTO vypyr_execs (program, ctrlr, value)
                    VALUES (?, ?, ?)`, [preset[0].program, preset[0].ctrlr, preset[0].value]);

                return "";
            }

            if (msg[0] === "select" && msg[1]) {
                const values = Object.assign([], ...Object.values(controls))

                if (!values.length) {
                    return `${user['username']}, predefined preset not found`;
                }

                await utils.query(`
                    INSERT INTO vypyr_execs (program, ctrlr, value)
                    VALUES (?, ?, ?)`, [values[msg[1]][0], values[msg[1]][1], values[msg[1]][2]]);

                return "";
            }

            if (!isNaN(msg[0]) && !isNaN(msg[1]) && !isNaN(msg[2])) {
                await utils.query(`
                    INSERT INTO vypyr_execs (program, ctrlr, value)
                    VALUES (?, ?, ?)`, [msg[0], msg[1], msg[2]]);

                return "";
            }
        } catch (err) {
            utils.errorLog(err)
            console.log(err)
            return `${user['username']}, error FeelsDankMan !!!`;
        }
    }
}