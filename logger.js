'use strict';

require('./lib/static/channel_status.js');
require('./lib/static/loops.js');

const creds = require('./lib/credentials/config.js');
const mysql = require('mysql2');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: creds.db_pass,
    database: "kbot"
});

con.on('error', (err) => {console.log(err)});
const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels_logger', (err, results) => {
        if (err) {
            const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
            const insert = [JSON.stringify(err), new Date()];
            con.query(mysql.format(sql, insert),
                (error, results) => {
                    if (error) {
                        console.log(error)
                        reject(error)
                    } else {
                        resolve(results)
                    }
                })
            reject(err);
        } else {
            resolve(results);
        }
    });
});

let channelList = [];
let channelOptions = [];
(async() => {
    channelList.push(await getChannels());
    await channelList[0].forEach(i => channelOptions.push(i.channel))
})()

const sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
sleep(1500);

const options = {
    options: {
        debug: false,
    },
    connection: {
        cluster: 'aws',
    },
    identity: {
        username: 'kunszgbot',
        password: creds.oauth,
    },
    channels: channelOptions,
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const ignoreList = [
    '268612479', // titlechange_bot
    '68136884', // Supibot
    '229225576', // kunszgbot
    '100135110', // StreamElements
    '122770725', // Scriptorex
    '442600612', // Mm_sUtilityBot
    '465732747', // charlestonbieber
    '469718952', // wayt00dank
    '64313471', // HuwoBot
    '425363834', // ThePositiveBot
    '97661864', // botnextdoor
    '413480192', // futuregadget8
    '132134724', // gazatu2
    '62541963', // snusbot
    '82008718', // pajbot
    '27574018', // magicbot321
    '264879410', // schnozebot
    '237719657', // fossabot
    '500670723', // VJBotardo
    '452276558', // spergbot02
    '500384894', // botder423
    '632499854', // verydonkbot
    '603757453'
];

kb.connect();

con.connect((err) => {
    if (err) {
        kb.say('kunszg', '@kunszg, database connection error monkaS')
        console.log(err)
    } else {
        console.log("Connected!");
    }
});

const query = (query, data = []) => new Promise((resolve, reject) => {
    con.execute(query, data, async(err, results) => {
        if (err) {
            reject(err);
        } else {
            resolve(results);
        }
    });
});

const updateMemory = async () => {
    await query(`
        UPDATE memory
        SET memory=?
        WHERE module="logger"`,
        [(process.memoryUsage().heapUsed/1024/1024).toFixed(2)]);
}
updateMemory();

setInterval(() => {
    updateMemory();
}, 601000)

const cache = [];
kb.on('message', (channel, user, message) => {
    const filterBots = ignoreList.filter(i => i === user['user-id']);

    const msg = message.trimRight();

    const channelParsed = channel.replace('#', '');

    if (filterBots.length != 0 || msg === '') {
        return;
    }

    // caching messages from Twitch chat
    cache.push({
        'channel': channelParsed,
        'username': user['username'],
        'user-id': user['user-id'],
        'color': user['color'],
        'message': msg,
        'date': new Date()
    });
})

const updateLogs = () => {
    cache.forEach(async (data) => {
        // log user's message
        await query(`
            INSERT INTO logs_${data['channel']} (username, message, date)
            VALUES (?, ?, ?)`,
            [data['username'], data['message'], data['date']])

        // insert a new user
        await query(`
            INSERT INTO user_list (username, userId, firstSeen, color, added)
            VALUES (?, ?, ?, ?, ?)`,
            [data['username'], data['user-id'], data['channel'], data['color'], data['date']]);

        // update last message of the user
        await query(`
            UPDATE user_list
            SET lastSeen=?
            WHERE username=?`,
            [`${data['date']}*${data['message']}`, data['username']]);

        // matching bad words
        const badWord = data['message'].match(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);
        if (badWord) {
            await query(`
                INSERT INTO bruh (username, channel, message, date)
                VALUES (?, ?, ?, ?)`,
                [data['username'], data['channel'], data['message'], data['date']]);
        }
    })
}
setInterval(()=>{
    if (cache.length>200) {
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