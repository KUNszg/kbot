#!/usr/bin/env node
'use strict';

(async() => {
    try {
        const creds = require('./lib/credentials/config.js');
        const mysql = require('mysql2');
        const regex = require('./lib/utils/regex.js');

        const con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: creds.db_pass,
            database: "kbot"
        });

        const query = (query, data = []) => new Promise((resolve, reject) => {
            con.execute(query, data, async(err, results) => {
                if (err) {
                    return;
                } else {
                    resolve(results);
                }
            });
        });

        this.channelList = await query('SELECT * FROM channels_logger');

        setInterval(async () => {
            this.channelList = await query('SELECT * FROM channels_logger');
        }, 600000);

        const channelOptions = this.channelList.map(i => i.channel)

        const options = {
            options: {
                debug: false,
            },
            identity: {
                username: 'ksyncbot',
                password: creds.oauth,
            },
            channels: channelOptions,
        };

        const tmi = require('tmi.js');
        const kb = new tmi.client(options);

        const ignoreList = [];

        (await query("SELECT * FROM logger_ignore_list")).map(i => ignoreList.push(i.userId));

        kb.connect();

        // retry joining the channels
        setInterval(() => {
            for (let i = 0; i < channelOptions.length; i++) {
                setTimeout(() => {
                    kb.join(channelOptions)
                }, i * 300);
            }
        }, channelOptions.length * 1000);


        con.connect((err) => {
            if (err) {
                kb.say('kunszg', '@kunszg, database connection error monkaS')
                console.log(err)
            } else {
                console.log("Connected!");
            }
        });

        con.on('error', (err) => {console.log(err)});

        const cache = [];
        const userCache = [];
        const mpsCache = [];

        kb.on('message', (channel, user, message) => {
            mpsCache.push(Date.now());
            
            const channels = this.channelList.filter(i => i.channel === channel.replace('#', ''));

            if (!channels[0]?.status ?? true) {
                return;
            }

            if (channels[0].status === "disabled") {
                return;
            }

            const msg = message.replace(regex.invisChar, '');

            const filterBots = ignoreList.filter(i => i === user['user-id']);
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
                await query(`
                    UPDATE user_list
                    SET lastSeen=?
                    WHERE userId=?`,
                    [
                        `${data['date']}*${data['channel']}*${data['message']}`, 
                        data['user-id']
                    ]);

                // log user's message
                await query(`
                    INSERT INTO logs_${data['channel']} (username, message, date)
                    VALUES (?, ?, ?)`, 
                    [
                        data['username'], 
                        data['message'], 
                        data['date']
                    ])

                // matching bad words
                const badWord = data['message'].match(regex.racism);
                if (badWord) {
                    await query(`
                        INSERT INTO bruh (username, channel, message, date)
                        VALUES (?, ?, ?, ?)`, 
                        [
                            data['username'], 
                            data['channel'], 
                            data['message'], 
                            data['date']
                        ]);
                }

                const checkIfUnique = await query(`
                    SELECT *
                    FROM user_list
                    WHERE username=?`, [data['username']]);
                
                if (!checkIfUnique.length) {
                    userCache.push(1);
                }

                // no code should appear after this function in this block
                await query(`
                    INSERT INTO user_list (username, userId, firstSeen, lastSeen, color, added)
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

        setInterval(() => {
            const mps = mpsCache.filter(i => i < (Date.now() - 1500));

         // send data to websocket
            new WSocket("wsl").emit(
                {type: "mps", data: (mps.length)}
            );

            mpsCache.length = 0;
        }, 3000);

        setInterval(() => {
            if (userCache.length != 0) {
                // send data to websocket
                new WSocket("wsl").emit(
                    {type: "usersTotal", data: userCache.length}
                );
                userCache.length = 0;
            }

            if (cache.length > 200) {
                updateLogs();
                cache.length = 0;
            }
        }, 7000);

        setInterval(async() => {
            await query(`
                UPDATE user_list
                SET color="gray"
                WHERE color IS null
                `);

            await query(`
                DELETE FROM user_list
                WHERE username IS null
                `);
        }, 1800000);

        const statusCheck = async() => {
            await query(`
                UPDATE stats
                SET date=?
                WHERE type="module" AND sha="logger"`,
                [new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        }
        statusCheck();
        setInterval(()=>{statusCheck()}, 60000);

        kb.on("subscription", async (channel, username, method, message) => {
            await query(`
                INSERT INTO subs (username, channel, months, subMessage, type, date)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [username, channel.replace('#', ''), "1", message, "subscription"]);

            if (channel === "#kunszg") {
                kb.say('kunszg', `${username} just subscribed KomodoHype !`);
            }
        });

        kb.on("subgift", async (channel, username, streakMonths, recipient, userstate) => {
            let cumulative = ~~userstate["msg-param-cumulative-months"];

            await query(`
                INSERT INTO subs (gifter, channel, months, username, type, date)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [username, channel.replace('#', ''), cumulative, recipient, "subgift"]);

            if (channel === "#kunszg") {
                kb.say('kunszg', `${recipient} got gifted a sub from ${username}, it's their ${cumulative} month KomodoHype !`);
            }
        });

        kb.on("resub", async (channel, username, streakMonths, message, userstate) => {
            let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];

            await query(`
                INSERT INTO subs (username, channel, months, subMessage, type, date)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [username, channel.replace('#', ''), cumulativeMonths, message, "resub"]);

            if (channel === "#kunszg") {
                kb.say('kunszg', `${username} just resubscribed for ${cumulativeMonths} months KomodoHype !`);
            }
        });

        kb.on("giftpaidupgrade", async (channel, username, sender) => {
            await query(`
                INSERT INTO subs (username, channel, gifter, type, date)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [username, channel.replace('#', ''), sender, "giftpaidupgrade"]);

            if (channel === "#kunszg") {
                kb.say('kunszg', `${username} is continuing the gifted sub they got from ${sender} KomodoHype !`);
            }
        });

        kb.on("anongiftpaidupgrade", async (channel, username) => {
            await query(`
                INSERT INTO subs (username, channel, type, date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [username, channel.replace('#', ''), "anongiftpaidupgrade"]);

            if (channel === "#kunszg") {
                kb.say('kunszg', `${username} is continuing the gifted sub they got from an anonymous user KomodoHype !`);
            }
        });

        // notice messages from twitch
        kb.on("notice", async (channel, msgid, message) => {
            if (msgid === "host_target_went_offline") {
                return;
            }

            await query(`
                INSERT INTO notice (msgid, message, channel, module, date)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [msgid, message, channel.replace('#', ''), "logger"]);
            return;
        });

        setInterval(async () => {
            await query(`
                UPDATE memory
                SET memory=?
                WHERE module="logger"`,
                [(process.memoryUsage().heapUsed/1024/1024).toFixed(2)]);
        }, 600000);
    } catch (err) {
        console.log("-------------------------------------------------------------\n");
        console.log(new Date().toISOString());
        console.log(err);
    }
})();