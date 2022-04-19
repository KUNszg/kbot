#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const got = require('got');
const shell = require("child_process");

module.exports = {
    name: "kb channels",
    invocation: async (channel, user, message) => {
        try {
            const msg = utils.getParam(message.toLowerCase());

            const shell = require('child_process')

            const getBotChannels = await utils.query("SELECT * FROM channels");

            const getLoggerChannels = await utils.query("SELECT * FROM channels_logger");

            const dbSize = (Number((shell.execSync('sudo du -s /opt/lampp/var/mysql/kbot')).toString().split('\t')[0])/1024/1024).toFixed(2);

            const owner = await utils.Get.user().owner();

            // response for non-admin users
            if (user['user-id'] != owner[0].userId) {
                return `${user['username']}, Bot is active in ${getBotChannels.length} channels, logger is in
                ${getLoggerChannels.length} channels and has collected ${dbSize}GB of data 4Head`;
            }

            // parameters for admins
            // check for wrong parameters
            if (msg[0] && !msg[1]) {
                return `${user['username']}, invalid parameter or no channel provided`;
            }

            if (!msg[0]) {
                return `${user['username']}, Bot is active in ${getBotChannels.length} channels, logger is in
                ${getLoggerChannels.length} channels and has collected ${dbSize}GB of data 4Head`;
            }

            if (msg[0] === "rename") {
                let _user = await utils.Get.user().byUsername(msg[1]);

                if (!_user.length) {
                    return `${user.username}, username was not found.`;
                }

                _user = await utils.Get.user().byId(_user[0].userId);

                if (_user.length < 2) {
                    return `${user.username}, no name changes were found.`;
                }

                for (let i = 0; i < _user.length - 1; i++) {
                    const checkTables = await utils.query(`SHOW TABLES LIKE 'logs_${_user[i].username}'`);

                    if (checkTables.length) {
                        const newName = _user[_user.length - 1].username;
                        const oldName = _user[i].username;

                        kb.say(channel, `${user.username}, logs_${oldName} was found` +
                            ` as a original logs table for ${newName}, starting the rename process...`);

                        await utils.query(`RENAME TABLE logs_${oldName} TO logs_${newName}`);
                        kb.say(channel, `${user.username}, table renaming completed.`);

                        await utils.query(`UPDATE channels SET channel="${newName}" where channel="${oldName}"`);
                        await utils.query(`UPDATE channels_logger SET channel="${newName}" where channel="${oldName}"`);
                        kb.say(channel, `${user.username}, channel join config has been updated.`);

                        await utils.query(`UPDATE logs_${newName} SET username="${newName}" WHERE username="${oldName}"`);
                        kb.say(channel, `${user.username}, channel owner logs have been updated to the new name.`);

                        kb.say(channel, `${user.username}, Restarting to apply changes...`);
                        kb.say(newName, `Successfully finished the channel after-rename process, you can fully use the bot now :)`);

                        setTimeout(() => {
                            shell.execSync('pm2 restart init');
                            shell.execSync('pm2 restart logger');
                        }, 1000);

                        return "";
                    }
                }

                kb.say(channel, `${user.username} no pre-existing tables were found.`);
            }

            if (msg[0] === "join-bulk") {
                const bulkJoin = async (_channel) => {
                    const requesteer = (_channel.split(":by:").length > 1) ? `(requested by channel moderator: @${_channel.split(":by:")[1]})` : "";

                    _channel = _channel.split(":by:")[0];

                    const checkRepeatedInsertBot = await utils.query(`
                        SELECT *
                        FROM channels
                        WHERE channel=?`,
                        [_channel]);

                    const checkRepeatedInsertLogger = await utils.query(`
                        SELECT *
                        FROM channels_logger
                        WHERE channel=?`,
                        [_channel]);

                    const checkTables = await utils.query(`SHOW TABLES LIKE 'logs_${_channel}'`);

                    if (checkRepeatedInsertBot.length) {
                        return `[bot] ${user['username']}, I'm already in this channel. [${_channel}]`
                    }

                    if (checkRepeatedInsertLogger.length) {
                        return `[logger] ${user['username']}, I'm already in this channel. [${_channel}]`;
                    }

                    const userId = await got(`https://api.ivr.fi/twitch/resolve/${_channel}`).json();

                    if (checkTables.length) {
                        await utils.query(`
                            INSERT INTO channels_logger (channel, userId, added)
                            VALUES ("${_channel}", "${userId.id}", CURRENT_TIMESTAMP)`);

                        await utils.query(`
                            INSERT INTO channels (channel, userId, added)
                            VALUES ("${_channel}", "${userId.id}", CURRENT_TIMESTAMP)`);

                        kb.join(_channel);

                        return `${user['username']}, rejoined channel #${_channel}`;
                    }

                    // add the channel to the table
                    await utils.query(`
                        INSERT INTO channels (channel, userId, added)
                        VALUES ("${_channel}", "${userId.id}", CURRENT_TIMESTAMP)
                        `);

                    kb.join(_channel);

                    await utils.query(`
                        CREATE TABLE logs_${_channel} (
                            ID INT(11) NOT NULL AUTO_INCREMENT,
                            username VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            message LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (ID) USING BTREE,
                            FULLTEXT INDEX message (message)
                        )
                        COLLATE='utf8mb4_general_ci'
                        ENGINE=InnoDB
                        ROW_FORMAT=COMPRESSED;`);

                    await utils.query(`
                        INSERT INTO channels_logger (channel, userId, added)
                        VALUES ("${_channel}", "${userId.id}", CURRENT_TIMESTAMP)`)

                    kb.say(_channel, `I have successfully joined this channel ${requesteer} MrDestructoid`);

                    return `successfully joined ${_channel.replace(/^(.{2})/, "$1\u{E0000}")} :) 👍 ${requesteer}`;
                }
                const _msg = utils.getParam(message.toLowerCase(), 3);

                for (let i = 0; i < _msg.length; i++) {
                    setTimeout(async() => {
                        kb.say(channel, await bulkJoin(_msg[i]))
                    }, 2000);
                }

                setTimeout(() => {
                    shell.execSync('pm2 restart logger');
                }, 2000 * _msg.length);

                return "";
            }

            // check if logger is in specified channel
            const checkRepeatedInsert = await utils.query(`
                SELECT *
                FROM channels_logger
                WHERE channel=?`,
                [msg[1]]);

            const checkRepeatedInsertBot = await utils.query(`
                SELECT *
                FROM channels
                WHERE channel=?`,
                [msg[1]]);

            const checkTables = await utils.query(`SHOW TABLES LIKE 'logs_${msg[1]}'`);

            const userId = await got(`https://api.ivr.fi/twitch/resolve/${msg[1]}`).json();

            switch (msg[0]) {
                case 'join':
                    if (checkRepeatedInsertBot.length) {
                        return `[bot] ${user['username']}, I'm already in this channel. [${msg[1]}]`;
                    }

                    if (checkRepeatedInsert.length) {
                        return `[logger] ${user['username']}, I'm already in this channel. [${msg[1]}]`;
                    }

                    if (checkTables.length) {
                        await utils.query(`
                            INSERT INTO channels_logger (channel, userId, added)
                            VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)`);

                        await utils.query(`
                            INSERT INTO channels (channel, userId, added)
                            VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)`);

                        kb.join(msg[1]);
                        shell.execSync('pm2 restart logger');

                        return `${user['username']}, rejoined channel #${msg[1]}`;
                    }

                    // add the channel to the table
                    await utils.query(`
                        INSERT INTO channels (channel, userId, added)
                        VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)
                        `);

                    kb.join(msg[1]);

                    await utils.query(`
                        CREATE TABLE logs_${msg[1]} (
                            ID INT(11) NOT NULL AUTO_INCREMENT,
                            username VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            message LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (ID) USING BTREE,
                            FULLTEXT INDEX message (message)
                        )
                        COLLATE='utf8mb4_general_ci'
                        ENGINE=InnoDB
                        ROW_FORMAT=COMPRESSED;`);

                    await utils.query(`
                        INSERT INTO channels_logger (channel, userId, added)
                        VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)`)

                    shell.execSync('pm2 restart logger');

                    kb.say(msg[1], 'I have successfully joined this channel MrDestructoid');

                    return `successfully joined ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} :) 👍`;

                case 'part':
                    if (!checkRepeatedInsertBot.length) {
                        return `${user['username']}, I'm not joined in that channel.`
                    }

                    if (!checkRepeatedInsert.length) {
                        return `${user['username']}, I'm not in that channel.`
                    }

                    // delete the row with provided channel
                    await utils.query(`
                        DELETE FROM channels
                        WHERE userId="${userId.id}"
                        `)

                    await utils.query(`
                        DELETE FROM channels_logger
                        WHERE userId="${userId.id}"
                        `);

                    kb.part(msg[1]);

                    shell.execSync('pm2 restart logger');

                    kb.say(msg[1], 'Parting the channel MrDestructoid 🔫');
                    return `parted the channel ${msg[1].replace(/^(.{2})/, "$1\u{E0000}")} with logger and bot.`;

                // join channel to logger's channel database and restart to apply changes
                case 'join-logger':
                    if (checkRepeatedInsert.length != 0) {
                        return `${user['username']}, I'm already in this channel. [${msg[1]}]`;
                    }

                    if (checkTables.length != 0) {
                        return `${user['username']}, I'm already in this channel. [${msg[1]}]`;
                    }

                    // create table with logs for the specified channel
                    kb.say(channel, `${user['username']}, creating table "logs_${msg[1]}"`)
                    await utils.query(
                        `CREATE TABLE logs_${msg[1]} (
                            ID INT(11) NOT NULL AUTO_INCREMENT,
                            username VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            message LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
                            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (ID) USING BTREE,
                            FULLTEXT INDEX message (message)
                        )
                        COLLATE='utf8mb4_general_ci'
                        ENGINE=InnoDB
                        ROW_FORMAT=COMPRESSED;
                        `)

                    const sleep = (milliseconds) => {
                        const start = new Date().getTime();
                        for (let i = 0; i < 1e7; i++) {
                            if ((new Date().getTime() - start) > milliseconds) {
                                break;
                            }
                        }
                    }

                    // add the channel to the database
                    sleep(1500)
                    await utils.query(`
                        INSERT INTO channels_logger (channel, userId, added)
                        VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)
                        `)

                    shell.execSync('pm2 restart logger')
                    sleep(700)
                    return `done SeemsGood`;

                // part channel from logger's channel database and restart to apply changes
                case 'part-logger':
                    if (!checkRepeatedInsert.length) {
                        return `${user['username']}, I'm not in that channel.`
                    }

                    // part the channel
                    await utils.query(`
                        DELETE FROM channels_logger
                        WHERE userId="${userId.id}"
                        `);

                    shell.execSync('pm2 restart logger')
                    return `done SeemsGood`;
            }
        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}