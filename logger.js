#!/usr/bin/env node
'use strict';

const init = require('./lib/utils/connection.js');
const creds = require('./lib/credentials/config.js');
const regex = require('./lib/utils/regex.js');

const redis = init.Redis;
const kb = new init.IRC();

redis.connect();
kb.tmiConnect();
kb.sqlConnect();

(async() => {
    try {
        this.channelList = await kb.query('SELECT * FROM channels_logger');

        setInterval(async () => {
            this.channelList = await kb.query('SELECT * FROM channels_logger');
        }, 600000);

        const cache = [];

        redis.init("cache", "userCache", "mpsCache", "ignoreList");

        await Promise.all(
            await kb.query("SELECT * FROM logger_ignore_list").map(async(i) => {
                await redis.append("ignoreList", i.userId);
            })
        );

        kb.on('message', async(channel, user, message) => {
            await redis.append("mpsCache", Date.now());

            const channels = this.channelList.filter(i => i.channel === channel.replace('#', ''));

            if (!channels[0]?.status ?? true) {
                return;
            }

            if (channels[0].status === "disabled") {
                return;
            }

            const msg = message.replace(regex.invisChar, '');

            const filterBots = (await redis.get("ignoreList")).filter(i => i === user['user-id']);
            if (filterBots.length != 0 || msg === '') {
                return;
            }

            // caching messages from Twitch chat
            cache.push({
                'channel': channel.replace('#', ''),
                'username': user['username'],
                'user-id': user['user-id'],
                'color': user['color'],
                'message': msg,
                'date': new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
        })

        const updateLogs = () => {
            cache.forEach(async (data) => {
                // update last message of the user
                await kb.query(`
                    UPDATE user_list
                    SET lastSeen=?
                    WHERE username=?`,
                    [
                        `${data['date']}*${data['channel']}*${data['message']}`,
                        data['username']
                    ]);

                // log user's message
                await kb.query(`
                    INSERT INTO logs_${data['channel']} (username, message, date)
                    VALUES (?, ?, ?)`,
                    [
                        data['username'],
                        data['message'],
                        data['date']
                    ])

                // matching bad words
                const badWord = data['message'].match(regex.racism) && !data['message'].match(/\bnl\d\d\b/g);
                if (badWord) {
                    await kb.query(`
                        INSERT INTO bruh (username, channel, message, date)
                        VALUES (?, ?, ?, ?)`,
                        [
                            data['username'],
                            data['channel'],
                            data['message'],
                            data['date']
                        ]);
                }

                const checkIfUnique = await kb.query(`
                    SELECT *
                    FROM user_list
                    WHERE username=?`, [data['username']]);

                if (!checkIfUnique.length) {
                    await redis.append("userCache", 1);
                }

                data['color'] = (data['color'] === '' || data['color'] === null) ? 'gray' : data['color'];

                // no code should appear after this function in this block
                await kb.query(`
                INSERT IGNORE INTO user_list (username, userId, firstSeen, lastSeen, color, added)
                VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        data['username'],
                        data['user-id'],
                        data['channel'],
                        `${data['date']}*${data['channel']}*${data['message']}`,
                        data['color'],
                        data['date']
                    ]);
            })
        }

        const WSocket = require("./lib/utils/utils.js").WSocket;

        setInterval(async() => {
            const mpsCache = JSON.parse(await redis.get("mpsCache"));
            const mps = mpsCache.filter(i => i < (Date.now() - 1500));

            // send data to websocket
            new WSocket("wsl").emit(
                {type: "mps", data: (mps.length)}
            );

            redis.arrayClear("mpsCache");
        }, 3000);

        setInterval(async() => {
            const userCache = JSON.parse(await redis.get("userCache"));

            if (userCache.length != 0) {
                // send data to websocket
                new WSocket("wsl").emit(
                    {type: "usersTotal", data: userCache.length}
                );
                redis.arrayClear("userCache");
            }

            if (cache.length > 200) {
                updateLogs();
                cache.length = 0;
            }
        }, 7000);

        setInterval(async() => {
            await kb.query("DELETE FROM user_list WHERE username IS null OR username = ''");
        }, 1800000);

        const statusCheck = async() => {
            await kb.query(`
                UPDATE stats
                SET date=?
                WHERE type="module" AND sha="logger"`,
                [new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        }
        statusCheck();
        setInterval(()=>{statusCheck()}, 60000);

        kb.on("usernotice", async(msg) => {
            const msgID = msg.messageTypeID;
            const channel = msg.channelName;

            if (msg.eventParams.subPlan) {
                const username = msg?.senderUsername ?? "anonymous";
                const message = msg?.messageText ?? "";
                const months = msg.eventParams?.cumulativeMonths ?? 0;
                const giftRecipient = msg.eventParams?.recipientUsername ?? "anonymous (somehow)";

                if (msgID.includes("gift")) {
                    await kb.query(`
                    INSERT INTO subs (username, gifter, channel, months, subMessage, type, date)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [giftRecipient, username, channel, months, message, msgID]);
                }
                else {
                    await kb.query(`
                    INSERT INTO subs (username, channel, months, subMessage, type, date)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [username, channel, months, message, msgID]);
                }
            }
            else {
                // notice messages from twitch
                if (msgID === "host_target_went_offline" || msgID === "host_on") {
                    return;
                }

                await kb.query(`
                    INSERT INTO notice (msgid, message, channel, module, date)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [msgID, msg.systemMessage, channel, "logger"]);
            }
        });

        kb.on("notice", async(channel, msgID, message) => {
            // notice messages from twitch
            if (msgID === "host_target_went_offline" || msgID === "host_on") {
                return;
            }

            await kb.query(`
                INSERT INTO notice (msgid, message, channel, module, date)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [msgID, message, channel.replace("#", ""), "logger"]);
        });

        setInterval(async () => {
            await kb.query(`
                UPDATE memory
                SET memory=?
                WHERE module="logger"`,
                [(process.memoryUsage().heapUsed/1024/1024).toFixed(2)]);
        }, 600000);
    } catch (err) {
        console.log(err);
    }
})();