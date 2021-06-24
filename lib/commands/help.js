#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
    name: "kb help",
    invocation: async (channel, user, message, platform) => {
        try {
            const msg = utils.getParam(message);

            const command = await utils.query(`
                SELECT *
                FROM commands
                WHERE command=?`,
                [msg[0]]);

            // default response
            if (!msg[0]) {
                return `${user['username']}, kunszgbot is owned by KUNszg, sponsored by
                ${'Leppunen'.replace(/^(.{2})/, "$1\u{E0000}")}, Node JS ${process.version}, running on
                Ubuntu 20.04 ${process.platform} ${process.arch}, for commands list use kb commands`;
            }

            if (!command.length) {
                return `${user['username']}, this command does not exist.`;
            }

            if (command[0].description === null) {
                return `${user['username']}, this command does not have a description.`;
            }

            let cooldown = command[0].cooldown;

            const sub = (val) => {
                return cooldown - (cooldown * val);
            }

            const perms = await utils.checkPermissions(user['username']);

            switch (Number(perms)) {
                case 1:
                    cooldown = sub(0.3); // reduce cooldown by 30% for permission 1
                    break;

                case 2:
                    cooldown = sub(0.5);
                    break;

                case 3:
                    cooldown = sub(0.65);
                    break;

                case 4:
                    cooldown = sub(0.75);
                    break;

                case 5:
                    cooldown = sub(0.9);
                    break;
            }

            if (platform === "discord") {
                cooldown = cooldown[0].cooldown;
            }

            if (user["username"] === "kunszg") {
                cooldown = 0;
            }

            return `${user['username']}, ${command[0].description} -- cooldown ${(cooldown/1000).toFixed(2)}sec`;
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}