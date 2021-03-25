#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const kb = require('../handler.js').kb;
const got = require('got');

const sleepGlob = (milliseconds) => {
    const start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

module.exports = {
    name: "kb channels",
    invocation: async (channel, user, message) => {
        try {
            const msg = utils.getParam(message.toLowerCase());

            const shell = require('child_process')

            const getBotChannels = await utils.query(`
                SELECT COUNT(ID) As query
                FROM channels`);

            const getLoggerChannels = await utils.query(`
                SELECT count(ID) As query
                FROM channels_logger`);

            const dbSize = (Number((shell.execSync('sudo du -s /opt/lampp/var/mysql/kbot')).toString().split('\t')[0])/1024/1024).toFixed(2);

            // response for non-admin users
            if (user['user-id'] != "178087241") {
                return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
                ${getLoggerChannels[0].query} channels and has collected ${dbSize}GB of data.
                List of channels: https://kunszg.com/ 4Head`;
            }

            // parameters for admins
            // check for wrong parameters
            if (msg[0] && !msg[1]) {
                return `${user['username']}, invalid parameter or no channel provided`;
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
                        return `${user['username']}, I'm already in this channel.`
                    }

                    if (checkRepeatedInsert.length) {
                        return `${user['username']}, I'm already in this channel.`;
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
                        ROW_FORMAT=COMPACT;`);

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
                        return `${user['username']}, I'm already in this channel.`;
                    }

                    if (checkTables.length != 0) {
                        return `${user['username']}, I'm already in this channel.`;
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
                        ROW_FORMAT=COMPACT
                        ;
                        `)

                    // add the channel to the database
                    sleepGlob(1500)
                    await utils.query(`
                        INSERT INTO channels_logger (channel, userId, added)
                        VALUES ("${msg[1]}", "${userId.id}", CURRENT_TIMESTAMP)
                        `)

                    shell.execSync('pm2 restart logger')
                    sleepGlob(700)
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

            if (!msg[0] && !msg[1]) {
                return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
                ${getLoggerChannels[0].query} channels and has collected ${dbSize}GB of data.
                List of channels: https://kunszg.com/ 4Head`;
            }

            return `${user['username']}, Bot is active in ${getBotChannels[0].query} channels, logger is in
            ${getLoggerChannels[0].query} channels and has collected ${dbSize}GB of data.
            List of channels: https://kunszg.com/ 4Head`;

        } catch (err) {
            utils.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}