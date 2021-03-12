#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got');
const kb = require('../handler.js').kb;

module.exports = {
    name: "kb ed",
    invocation: async (channel, user, message, platform) => {
        try {
            const msg = custom.getParam(message);

            if (platform === "whisper") {
                return "This usage is disabled on this platform";
            }

            let getAlias = await custom.query(`
                SELECT *
                FROM user_list
                WHERE userId=?`,
                [user['user-id']]);

            // check if user is in the database, if not then add him
            // this issue might happen in channels where bot is in no-logging mode and non-existing user in database tries to use the command
            if (!getAlias[0]?.ID ?? true) {
                await custom.query(`
                    INSERT INTO user_list (username, userId, firstSeen, color, added)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [user['username'], user['user-id'], channel.replace('#', ''), user['color']]);

                getAlias = await custom.query(`
                    SELECT *
                    FROM user_list
                    WHERE userId=?`,
                    [user['user-id']]);
            }

            const userData = await custom.query(`
                SELECT *
                FROM ed_reminders
                WHERE user_alias=?`,
                [getAlias[0].ID]);

            switch (msg[0]) {
                case 'module':
                    if (await custom.checkPermissions(user['username'])<3) {
                        return '';
                    }
                    await custom.query(`
                        UPDATE cookieModule
                        SET reminders=?
                        WHERE type="ed"`,
                        [msg[1]]);

                    return `updated "ed" module status to ${msg[1]}`;

                case 'force':
                    function sleep(milliseconds) {
                        const start = new Date().getTime();
                        for (var i = 0; i < 1e7; i++) {
                            if ((new Date().getTime() - start) > milliseconds) {
                                break;
                            }
                        }
                    }
                    sleep(1000)
                    const edApi = await got(`https://huwobot.me/api/user?id=${user['user-id']}`).json();

                    const regCheck = await custom.query(`
                        SELECT *
                        FROM ed_reminders
                        WHERE user_alias=?`,
                        [getAlias[0].ID]);

                    const now = new Date();

                    // check if user is registered
                    if (!regCheck.length) {
                        return `${user['username']}, you are not registered in the database,
                        use "kb ed register" to do so.`;
                    }

                    if ((Date.now(new Date())/1000) - edApi.next_entry.toFixed(0) >= 0) {
                        return `${user['username']}, you can enter the dungeon right now! (+ed)`;
                    }

                    Date.prototype.addMinutes = function(minutes) {
                        const copiedDate = new Date(this.getTime());
                        return new Date(copiedDate.getTime() + minutes * 1000);
                    }

                    async function updateReminder(time) {
                        const timestamp = now.addMinutes(time).toISOString().slice(0, 19).replace('T', ' ');
                        await custom.query(`
                            UPDATE ed_reminders
                            SET channel=?,
                                fires=?,
                                status="scheduled"
                            WHERE user_alias=?`,
                            [channel.replace('#', ''), timestamp, getAlias[0].ID]);
                    }

                    const asd = edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000)
                    updateReminder(asd)

                    kb.whisper(user['username'], `I will remind you to enter dungeon in  ${custom.format(edApi.next_entry.toFixed(0) - (Date.now(new Date())/1000))} (forced reminder)`);
                    break;

                case 'register':

                    if (!userData.length) {
                        await custom.query(`
                            INSERT INTO ed (username, created)
                            VALUES (?, CURRENT_TIMESTAMP)`,
                            [user['username']]);

                        await custom.query(`
                            INSERT INTO ed_reminders (username)
                            VALUES (?)`,
                            [user['username']]);

                        await custom.query(`
                            UPDATE user_list t1, ed_reminders t2
                            SET t2.user_alias=t1.ID
                            WHERE t2.username=? AND t1.userId=?`,
                            [user['username'], user['user-id']]);

                        return `${user['username']}, you have been successfully registered for a dungeon
                        reminder, Your reminders will be whispered to you.`;

                    }

                    if (userData[0].user_alias === getAlias[0].ID) {
                        return `${user['username']}, you are already registered for dungeon reminders,
                        type "kb help ed" for command syntax.`;
                    }
                    return '';

                case 'unregister':

                    if (!userData.length) {
                        return `${user['username']}, you are not registered for a dungeon reminder,
                        therefore you can't be unregistered FeelsDankMan`;
                    }

                    await custom.query(`
                        INSERT INTO trash (username, channel, cmd, added)
                        VALUES (?, ?, "ed", CURRENT_TIMESTAMP)`,
                        [user['username'], channel.replace('#', '')]);

                    await custom.query(`
                        DELETE
                        FROM ed_reminders
                        WHERE user_alias=?`,
                        [getAlias[0].ID]);

                    return `${user['username']}, you are no longer registered for a dungeon reminder.`;

                case 'silence':
                    const checkUsers = await custom.query(`
                        SELECT *
                        FROM ed_reminders
                        WHERE user_alias=?`,
                        [getAlias[0].ID]);

                    if (!checkUsers.length) {
                        return `${user['username']}, you are not registered for a dungeon reminder,
                        therefore you can't be unregistered FeelsDankMan`;
                    }

                    if (checkUsers[0].initPlatform === "silence") {
                        await custom.query(`
                            UPDATE ed_reminders
                            SET initPlatform="whisper"
                            WHERE user_alias=?`,
                            [getAlias[0].ID]);

                        return `${user['username']}, You have set your feedback message to appear in whispers.`;
                    }
                    await custom.query(`
                        UPDATE ed_reminders
                        SET initPlatform="silence"
                        WHERE user_alias=?`,
                        [getAlias[0].ID]);

                    return `${user['username']}, You have muted your feedback message. Use this command again to undo it.`;

                default:
                    return `${user['username']}, invalid syntax. See "kb help ed" for command help.`;
            }
            return '';

        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}
