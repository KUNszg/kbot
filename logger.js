'use strict';

require('./lib/static/channel_status.js');
require('./lib/static/interval_calls.js');

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
    '500384894' // botder423
];

kb.connect();

kb.whisper('kunszg', 'logger reconnected');

con.connect((err) => {
    if (err) {
        kb.say('kunszg', '@kunszg, database connection error monkaS')
        console.log(err)
    } else {
        console.log("Connected!");
    }
});

const doQuery = (query) => new Promise((resolve, reject) => {
    con.query(query, (err, results) => {
        if (err) {
            return;
        } else {
            resolve(results);
        }
    });
});

const updateMemory = async () => {
    await doQuery(`
        UPDATE memory SET memory="${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}" WHERE module="logger"
        `)
}
updateMemory();

setInterval(() => {
    updateMemory();
}, 601000)

const cache = [];
kb.on('message', (channel, user, message) => {
    const filterBots = ignoreList.filter(i => i === user['user-id'])
    const msg = message.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
    const channelParsed = channel.replace('#', '');
    if (filterBots.length != 0 || msg === '') {
        return;
    }

    // caching messages from Twitch chat
    cache.push({
        'channel': channelParsed,
        'username': user['username'],
        'message': msg,
        'date': new Date()
    });
})



// inserting cached rows every interval to database instead of real-time logging
const updateLogs = () => {
    cache.forEach(async(data) => {
        const sql = `INSERT INTO logs_${data['channel']} (username, message, date) VALUES (?, ?, ?)`;
        const inserts = [data['username'], data['message'], data['date']];
        await doQuery(mysql.format(sql, inserts))

        // matching bad words
        const badWord = data['message'].match(/(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/);

        if (badWord) {
            const sqlBruh = `INSERT INTO bruh (username, channel, message, date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
            const insertsBruh = [data['username'], data['channel'], data['message']];
            await doQuery(mysql.format(sqlBruh, insertsBruh))
        }
    })
}
setInterval(()=>{
    if (cache.length>200) {
        updateLogs();
        cache.length = 0;
    }
}, 7000);

kb.on('message', async (channel, user) => {
    const sqlUser = "INSERT INTO user_list (username, userId, channel_first_appeared, color, added) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    const insertsUser = [user['username'], user['user-id'], channel.replace('#', ''), user['color']]
    await doQuery(mysql.format(sqlUser, insertsUser))
});

setInterval(async() => {
    await doQuery(`
        UPDATE user_list
        SET color="gray"
        WHERE color IS null
        `);
    await doQuery(`
        DELETE FROM user_list
        WHERE username IS null
        `);
}, 1800000);

const statusCheck = async() => {
    await doQuery(`
        UPDATE stats
        SET date="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
        WHERE type="module" AND sha="logger"
        `)
}
statusCheck();
setInterval(()=>{statusCheck()}, 60000);

kb.on("subscription", async (channel, username, method, message) => {
    const sqlUser = "INSERT INTO subs (username, channel, months, subMessage, type, date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
    const insertsUser = [username, channel.replace('#', ''), "1", message, "subscription"];
    await doQuery(mysql.format(sqlUser, insertsUser));

    if (channel === "#kunszg") {
        for (let i=0; i<12; i++) {
            if (i<13) {
                kb.say('kunszg', `${username} just subscribed` + ' KomodoHype  '.repeat(i+1) + ' !');
            }
        }
        for (let i=22; i>0; i--) {
            if (i<13) {
                kb.say('kunszg', `${username} just subscribed` + ' KomodoHype  '.repeat(i-1) + ' !');
            }
        }
    }
});

kb.on("subgift", async (channel, username, streakMonths, recipient, userstate) => {
    let cumulative = ~~userstate["msg-param-cumulative-months"];

    if (username.toLowerCase()==="teodorv") {
        for (let i=0; i<3; i++) {
            kb.whisper('kunszg', "teo just got a sub gift in " + channel);
        }
    }

    const sqlUser = "INSERT INTO subs (gifter, channel, months, username, type, date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
    const insertsUser = [username, channel.replace('#', ''), cumulative, recipient, "subgift"];
    await doQuery(mysql.format(sqlUser, insertsUser));

    if (channel === "#kunszg") {
        for (let i=0; i<11; i++) {
                kb.say('kunszg', `${recipient} got gifted a sub from ${username}, it's their ${cumulative} month` + ' KomodoHype '.repeat(i+1) + ' !');
        }
    }
});

kb.on("resub", async (channel, username, streakMonths, message, userstate) => {
    let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];

    const sqlUser = "INSERT INTO subs (username, channel, months, subMessage, type, date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
    const insertsUser = [username, channel.replace('#', ''), cumulativeMonths, message, "resub"];
    await doQuery(mysql.format(sqlUser, insertsUser));

    if (channel === "#kunszg") {
        for (let i=0; i<11; i++) {
                kb.say('kunszg', `${username} just resubscribed for ${cumulativeMonths} months` + ' KomodoHype '.repeat(i+1) + ' !');
        }
    }
});

kb.on("giftpaidupgrade", async (channel, username, sender) => {
    const sqlUser = "INSERT INTO subs (username, channel, gifter, type, date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
    const insertsUser = [username, channel.replace('#', ''), sender, "giftpaidupgrade"];
    await doQuery(mysql.format(sqlUser, insertsUser));

    if (channel === "#kunszg") {
        for (let i=0; i<11; i++) {
                kb.say('kunszg', `${username} is continuing the gifted sub they got from ${sender}` + ' KomodoHype '.repeat(i+1) + ' !');
        }
    }
});

kb.on("anongiftpaidupgrade", async (channel, username) => {
    const sqlUser = "INSERT INTO subs (username, channel, type, date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
    const insertsUser = [username, channel.replace('#', ''), "anongiftpaidupgrade"];
    await doQuery(mysql.format(sqlUser, insertsUser));

    if (channel === "#kunszg") {
        for (let i=0; i<11; i++) {
                kb.say('kunszg', `${username} is continuing the gifted sub they got from an anonymous user` + ' KomodoHype '.repeat(i+1) + ' !');
        }
    }
});