#!/usr/bin/env node
'use strict';

const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const got = require('got');
const creds = require('./lib/credentials/config.js');
const utils = require('./lib/utils/utils.js');
const bodyParser = require('body-parser');
const shell = require('child_process');
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100
});

const app = express();

app.enable('trust proxy');
app.set('trust proxy', 1);

app.use("/api/", apiLimiter);

const con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: creds.db_pass,
	database: "kbot"
});

con.on('error', (err) => {
    console.log(err);
});

con.connect((err) => {
	if (err) {
		console.log('Database connection error in express');
	}
});

const options = {
    options: {
        debug: false,
    },
    connection: {
        cluster: 'aws',
    },
    identity: {
        username: 'ksyncbot',
        password: creds.oauth,
    }
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

// github webhook
const crypto = require("crypto");

const secret = creds.webhook_github_secret;

const GithubWebHook = require('./lib/utils/git-webhook-middleware.js');
const webhookHandler = GithubWebHook({ path: '/webhooks/github', secret: secret });

app.use(bodyParser.json());
app.use(webhookHandler);

const rateLimiter = new Set();

webhookHandler.on('*', async function (event, repo, data, head) {
    new utils.WSocket("wsl").emit({
        type: "github",
        data: [
            {"event": event},
            {"repo": repo},
            {"data": data},
            {"head": head}
        ]}
    );

    if (event === "push") {
        await utils.query(`
            UPDATE stats
            SET date=?, sha=?
            WHERE type="ping"`,
            [data.head_commit.timestamp, data.head_commit.id.slice(0, 7)]);

        const files = (filenames) => {
            const path = require('path');

            const result = [];

            for (let i = 0; i < filenames.length; i++) {
                result.push(path.parse(filenames[i]).name);
            }

            return result.join(", ");
        }

        if (data.commits.length > 1) {
            kb.say("ksyncbot", `[github webhook] ⬆  New push ${data.head_commit.id.slice(0, 7)} with
                ${data.commits.length} commits in ksyncbot's repository #⃣
                "${data.head_commit.message}" 🔄 changes in: ${files(data.head_commit.modified)}, `);
            return;
        }

        kb.say("ksyncbot", `[github webhook] ⬆  New commit ${data.head_commit.id.slice(0, 7)} in
            ksyncbot's repository #⃣  "${data.head_commit.message}" 🔄
            changes in: ${files(data.head_commit.modified)}`);
    }

    if (event === "create") {
        if (data.ref_type === "branch") {
            kb.say("ksyncbot", `[github webhook] New branch "${data.ref}" has been created in
                ksyncbot's repository`);
        }

        if (data.ref_type === "tag") {
            kb.say("ksyncbot", `[github webhook] New tag "${data.ref}" has been created in
                ksyncbot's repository`);
        }
    }

    if (event === "delete") {
        if (data.ref_type === "branch") {
            kb.say("ksyncbot", `[github webhook] Branch "${data.ref}" has been deleted in
                ksyncbot's repository`);
        }

        if (data.ref_type === "tag") {
            kb.say("ksyncbot", `[github webhook] Tag "${data.ref}" has been deleted in
                ksyncbot's repository`);
        }
    }

    if (event === "commit_comment") {
        if (data.action === "created") {
            const trim = (data.comment.body.length > 350) ?
                data.comment.body.substring(0, 350) :
                data.comment.body;

            kb.say("ksyncbot", `[github webhook] A commit comment has been created
                at line ${data.comment.line} ▶ "${trim}" ${data.comment.url}`);
        }
    }

    if (event === "star" && data.action === "created") {
        const key = "star-" + data.sender.login;

        if (rateLimiter.has(key)) { return; }

        rateLimiter.add(key);

        setTimeout(() => {
            rateLimiter.delete(key);
        }, 1200000);

        kb.say("ksyncbot", `[github webhook] ${data.sender.login} just starred the ksyncbot repository for the total
            of ${data.repository.stargazers_count} stars PogChamp <3 https://github.com/KUNszg/kbot`);
    }

    if (event === "repository_vulnerability_alert") {
        if (data.action === "create") {
            kb.say("ksyncbot", `[github vulnerability alert]  monkaS package ${data.alert.affected_package_name} in
                https://github.com/KUNszg/kbot has been spotted by ${data.sender.login}
                as ${data.alert.severity} severity for version range ${data.alert.affected_range}`);
        }

        if (data.action === "dismiss") {
            kb.say("ksyncbot", `[github vulnerability alert] Vulnerability from ${data.alert.affected_package_name}
                package with ${data.alert.severity} severity has been dismissed in https://github.com/KUNszg/kbot`);
        }

        if (data.action === "resolve") {
            kb.say("ksyncbot", `[github vulnerability alert] Vulnerability from ${data.alert.affected_package_name}
                package with ${data.alert.severity} severity has been fixed and resolved to version
                ${data.alert.fixed_in} in https://github.com/KUNszg/kbot`);
        }
    }

    if (event === "fork") {
        kb.say("ksyncbot", `[github webhook] ${data.sender.login} just forked the repo PogChamp !
         https://github.com/KUNszg/kbot ➡ https://github.com/${data.forkee.full_name}`);
    }

    if (event === "pull_request") {
        if (data.action === "opened") {
            kb.say("ksyncbot", `[github webhook] ⬇ New pull request #${data.number} "${data.pull_request.title}" 📂  opened by
                ${data.pull_request.user.login}, mergeable state: ${data.pull_request.base.mergeable_state} ${data.pull_request.html_url}`);
        }

        if (data.action === "closed") {
            const isMerged = data.pull_request.base.merged ? "without merging" : "and merged";
            kb.say("ksyncbot", `[github webhook] ✅ pull request #${data.number} has been closed ${isMerged} by ${data.sender.login}
                at ${data.pull_request.closed_at.toString().replace(/T|Z/g, " ")}${data.pull_request.html_url}`);
        }
    }

    if (event === "issues") {
        if (data.action === "opened") {
            kb.say("ksyncbot", `[github webhook] ✅New issue created #${data.issue.number} "${data.issue.title}"
                by ${data.issue.user.login} ${data.issue.html_url}`);
        }

        if (data.action === "closed") {
             kb.say("ksyncbot", `[github webhook] ⛔ issue #${data.issue.number} has been closed by ${data.sender.login}
                at ${data.issue.closed_at.toString().replace(/T|Z/g, " ")} ${data.issue.html_url}`);
        }

        if (data.action === "deleted") {
             kb.say("ksyncbot", `[github webhook] ❌ issue #${data.issue.number} has been deleted by ${data.sender.login}
                at ${new Date().toISOString().replace(/T|Z/g, " ").split('.')[0]}`);
        }
    }

    return;
});

app.use(async function(req, res, next) {
    await utils.conLog(req);
    next();
});

// api handling
app.get("/connections", async (req, res) => {
    const userCount = await utils.query(`
        SELECT COUNT(*) AS count
        FROM access_token
        WHERE platform="spotify" AND user IS NOT NULL`);

    const execCount = await utils.query(`
        SELECT COUNT(*) AS count
        FROM executions
        WHERE command LIKE "%spotify%"`);

    let html = fs.readFileSync('./website/html/express_pages/connections.html');

    html = html.toString();

    const page = new utils.Swapper(html, [{
        "execs": execCount[0].count,
        "users": userCount[0].count
    }]);

    res.send(page.template());


    return;
});

// todo chatguesser game
/*app.get("/chatguesser", async (req, res) => {
    const randomChannel = "logs_nymn"

    const maxId = await utils.query(`SELECT MAX(ID) as maxid FROM ??`, [randomChannel])
    const randomId = Math.floor(Math.random() * Math.floor(maxId[0].maxid));

    let messages = await utils.query(`
        SELECT t.username, t.message, t.date
        FROM (
            SELECT id
            FROM ??
            ORDER BY id
            LIMIT ?, 100
            ) q
        JOIN ?? t
        ON t.id = q.id`,
        [randomChannel, Number(randomId), randomChannel]);

    const emotes = await utils.query(`
        SELECT *
        FROM emotes
        WHERE channel=?`, [randomChannel.replace('logs_', '')]);

    for (let i = 0; i<messages.length; i++) {
        for (let j = 0; j<emotes.length; j++) {
            const emoteRegex = new RegExp(`\\b${emotes[j].emote.toString()}\\b`, "g");
            const replace = (emotes[j].url === null) ? emotes[j].emote : `<img style="vertical-align: middle; margin-top: -5px" src="${emotes[j].url}">`;
            messages[i].message = messages[i].message.replace(emoteRegex, replace);
        }
    }

    res.send(`<!DOCTYPE html>
        <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script
                src="https://code.jquery.com/jquery-3.6.0.js"
                integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk="
                crossorigin="anonymous"></script>
            <style>
            body {
              margin: 0 auto;
              max-width: 430px;
              padding: 0 20px;
            }

            .container {
              border-top: 1px solid #999a;
              background-color: rgb(40,40,40);
              padding: 6px;
              margin: 1px 0;
            }

            .darker {
              background-color: rgb(30,30,30);
            }

            .container::after {
              content: "";
              clear: both;
              display: table;
            }

            .time-left {
              float: left;
              color: #999;
            }

            .chatbox {
              margin-top: 5vh;
              margin-bottom: 5vh;
              padding: 3px;
              word-break: break-word;
              word-wrap: break-word;
              overflow: scroll;
              overflow-x: hidden;
              height: 80vh;
            }

            .container:nth-child(odd) {
                background-color: #202020;
            }

            .container:nth-child(even) {
                background-color: #2c2c2c;
            }

            </style>
            </head>
            <body style="background-color: #1a1a1a;">
                <div class="chatbox" id="chatbox"></div>
                <script type="text/javascript">
                    const chatData = ${JSON.stringify(messages)};
                    for (let i = 0; i<${messages.length}; i++) {
                        if (i === 0) {
                            $("#chatbox").append('<div class="container"><span class="time-left">' + (new Date(chatData[i].date).toISOString().split('T')[1].split('.')[0]) + '<span style="color:white"><strong style="color: red"> '+ chatData[i].username +':</strong> ' + chatData[i].message + '</span></span></div>');
                        } else {
                        console.log((Date.parse(chatData[i].date) - Date.parse(chatData[i-1].date)));
                            setTimeout(() => {
                                $("#chatbox").append('<div class="container"><span class="time-left">' + (new Date(chatData[i].date).toISOString().split('T')[1].split('.')[0]) + '<span style="color:white"><strong style="color: red"> '+ chatData[i].username +':</strong> ' + chatData[i].message + '</span></span></div>');
                                $("#chatbox").scrollTop($("#chatbox")[0].scrollHeight);
                            }, 500);
                        }
                    }
                </script>
            </body>
        </html>
        `)
})*/

app.get("/api/user", async(req, res) => {
    const userid = req.headers["userid"] || req.query.userid;
    const username = req.headers["username"] || req.query.username;

    if (username) {
        const user = await utils.Get.user().byUsername(username.toLowerCase());

        if (!user.length) {
            res.send({
                "status": 404,
                "message": "user not found"
            });
            return;
        }

        const users = await utils.Get.user().byId(user[0].userId);

        const getOptedOut = await utils.Get.user().optout("namechange", users[0].userId, "userId");

        if (getOptedOut.length && (user['user-id'] != users[0].userId)) {
            res.send({
                "status": 403,
                "message": "user has opted out from being searched by this endpoint"
            });
            return;
        }

        const pastUsernames = users.map(({username, userId, color, added}) => ({
            username: username,
            color: color,
            foundUTC: added,
            foundTimestamp: Date.parse(added)
        }));

        res.send({
            "status": 200,
            "userid": user[0].userId,
            "currentUsername": users[users.length-1].username,
            "nameHistory": pastUsernames
        });

        return;
    }

    if (userid) {
        const users = await utils.Get.user().byId(userid);

        const getOptedOut = await utils.Get.user().optout("namechange", users[0].userId, "userId");

        if (!users.length) {
            res.send({
                "status": 404,
                "message": "user not found"
            });
            return;
        }

        if (getOptedOut.length && (user['user-id'] != users[0].userId)) {
            res.send({
                "status": 403,
                "message": "user has opted out from being searched by this endpoint"
            });
            return;
        }

        const pastUsernames = users.map(({username, userId, color, added}) => ({
            username: username,
            color: color,
            foundUTC: added,
            foundTimestamp: Date.parse(added)
        }));

        res.send({
            "status": 200,
            "userid": userid,
            "currentUsername": users[users.length-1].username,
            "nameHistory": pastUsernames
        });

        return;
    }

    res.send({
        "status": 400,
        "message": "bad request"
    });
});

// kunszg.com/api/channels
app.get("/api/channels", async (req, res) => {
    if (typeof req.query.details === "undefined") {
        let channelList = await utils.query("SELECT * FROM channels");

        channelList = channelList.map(i => i.channel);

        res.send({
            "data": channelList
        });
        return;
    }

    if (Boolean(req.query.details) && !Array.isArray(req.query.details)) {
        let channels, logs;

        if (!req.query.channel || Array.isArray(req.query.channel)) {
            channels = await utils.query("SELECT * FROM channels");
            logs = await utils.query("SELECT * FROM channels_logger");
        }
        else {
            channels = await utils.query(`
                SELECT *
                FROM channels
                WHERE channel=?`, [req.query.channel])

            logs = await utils.query(`
                SELECT *
                FROM channels_logger
                WHERE channel=?`, [req.query.channel])

            if (!channels.length) {
                res.send({error: "Channel not found", code: 404});
                res.status(404);
                return;
            }
        }

        const executions = await utils.query(`
            SELECT channel, COUNT(*) AS count
            FROM executions
            GROUP BY channel
            ORDER BY count
            DESC`);

        const banphraseApis = await utils.query("SELECT * FROM channel_banphrase_apis");

        const result = {};

        for (let i = 0; i < channels.length; i++) {
            const _channel = channels[i].channel;

            const findExecutions = executions.find(i => i.channel === _channel);
            const executionsCount = findExecutions ? Number(findExecutions.count) : 0;

            const findLoggedChannel = logs.find(i => i.channel === _channel);
            const isLogging = findLoggedChannel ? (findLoggedChannel.status === "enabled" ? true : false) : false;

            const timestampBot = (new Date(channels[i].added)).getTime();
            const timestampLogger = findLoggedChannel ? (new Date(findLoggedChannel.added)).getTime() : null;

            const findBanphraseChannels = banphraseApis.find(i => i.channel === _channel);
            const isBanphraseApiActive = findBanphraseChannels ? (findBanphraseChannels.status === "enabled" ? true : false) : false;
            const banphraseApi = isBanphraseApiActive ? findBanphraseChannels.url : null;

            const tableSize = findLoggedChannel ?
                shell.execSync(`sudo du --apparent-size --block=M -s /opt/lampp/var/mysql/kbot/logs_${_channel}.ibd`).toString().split('/')[0].replace("M", "") : null;

            Object.defineProperties(result,{
                [_channel]: {
                    value: {
                        "id": Number(channels[i].ID),
                        "userId": Number(channels[i].userId),
                        "name": _channel,
                        "liveStatus": channels[i].status,
                        "isStrict": (channels[i].strict) === "Y" ? true : false,
                        "created": new Date(timestampBot).toISOString(),
                        "createdTimestamp": Number(timestampBot),
                        "commandsUsed": executionsCount,
                        "isBanphraseApiActive": isBanphraseApiActive,
                        "banphraseApi": banphraseApi,
                        "logger": {
                            "id": findLoggedChannel ? findLoggedChannel.ID : null,
                            "isLogging": isLogging,
                            "created": timestampLogger === null ? null : new Date(timestampLogger).toISOString(),
                            "createdTimestamp": timestampLogger === null ? null : Number(timestampLogger),
                            "tableSize": Number(tableSize)
                        }
                    },
                    writable: true,
                    enumerable: true,
                    configurable: true
                }
            });
        }

        res.send({
            code: 200,
            count: channels.length,
            channels: result
        });
        return;
    }

    res.send({error: "Bad request", code: 400});
    res.status(400);
    return;
});

app.get("/countdown", async (req, res) => {
    try {


        if (!req.query?.verifcode ?? false) {
            const verifCode = utils.genString();

            let html = `<!DOCTYPE html>
                    <html>
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                            <link rel="stylesheet" type="text/css" href="https://kunszg.com/express_pages/styles/style_lastfm.css">
                            <meta http-equiv="Pragma" content="no-cache" />
                            <meta http-equiv="Cache-Control" content="no-cache" />
                            <meta http-equiv="Expires" content="0" />
                            <title>Countdown</title>
                        </head>
                        <body>
                            <div class="container">
                                <form action="/countdown" autocomplete="off">
                                  <label for="seconds" autocomplete="off" class="labelbox">Input value in seconds </label><br>
                                  <input type="text" id="seconds" name="seconds" style="width: 200px;" placeholder="default: 120" autocomplete="off" pattern="[0-9]*"><br>
                                  <input type="hidden" id="verifcode" name="verifcode" value="${verifCode}" autocomplete="off"><br>
                                  <input type="submit" value="Submit">
                                </form>
                            </div>
                        </body>
                    </html>`;

            await utils.query(`
                INSERT INTO countdown (verifcode, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
                [verifCode]);

            res.send(html);
            return;
        }

        if (!req.query?.seconds ?? false) {
            req.query.seconds = 120;
        }

        const checkIfUpdated = await utils.query(`
            SELECT *
            FROM countdown
            WHERE verifcode=?`,
            [req.query.verifcode]);

        if (!checkIfUpdated.length) {
            res.send("<body>Combination not found, refresh the previous page and try again</body>");
            return;
        }

        if (checkIfUpdated[0].seconds === null) {
            await utils.query(`
                UPDATE countdown SET seconds=?
                WHERE verifcode=?`,
                [Date.now()/1000 + Number(req.query.seconds), req.query.verifcode]);
        }

        const seconds = await utils.query(`
            SELECT *
            FROM countdown
            WHERE verifcode=?`,
            [req.query.verifcode]);

        let html = fs.readFileSync('./website/html/express_pages/countdown.html');

        html = html.toString();

        const page = new utils.Swapper(html, [{
            "seconds": seconds[0].seconds,
            "code": req.query.verifcode,
            "secValue": req.query.seconds,
            "stringLength": `https://kunszg.com/countdown?seconds=${req.query.seconds}&verifCode=${req.query.verifcode}`.length + 8
        }]);

        res.send(page.template())
        return;
    } catch (err) {
        console.log(err);
    }
});

app.get("/lastfmresolved", async (req, res) => {
    if (typeof req.query.verifcode === "undefined" || typeof req.query.user === "undefined") {
        throw "no query"
    }

    const checkIfUserExists = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${req.query.user}&api_key=${creds.lastfmApiKey}&format=json&limit=2`).json();
    if (!checkIfUserExists?.user.name ?? true) {
        res.send('<body>This username does not exist on Lastfm.</body>');
        return;
    }

    let html = fs.readFileSync('./website/html/express_pages/lastfmResolve.html');

    html = html.toString();

    const page = new utils.Swapper(html, [{
        "code": req.query.verifcode
    }])

    try {
        (async () => {
            res.send(page.template());

            await utils.query(`
                UPDATE access_token
                SET access_token=?,
                    refresh_token="lastfm currently playing",
                    platform="lastfm",
                    premium="N",
                    allowlookup="N",
                    scopes="lastfm currently playing"
                WHERE code=?`,
                [req.query.user, req.query.verifcode]);
        })();
    } catch (err) {
        if (err.message === "Response code 400 (Bad Request)") {
            res.send('<body>Your code has expired, repeat the process.</body>');
            return;
        }

        if (err.message === "no query") {
            res.send('<body>Invalid code.</body>');
            return;
        }
    }


    return;
});

app.get("/lastfm", async (req, res) => {
    const verifCode = utils.genString();

    const accessToken = await utils.query(`
        SELECT *
        FROM access_token
        WHERE code="verifCode"`);

    if (accessToken.length != 0) {
        res.send('<body>error<body>');
    }

    await utils.query(`
        INSERT INTO access_token (code)
        VALUES (?)`, [verifCode]);

    let html = fs.readFileSync('./website/html/express_pages/lastfm.html');

    html = html.toString();

    const page = new utils.Swapper(html, [{
        "code": verifCode
    }])

    res.send(page.template());

    return;
});

app.get("/resolved", async (req, res) => {
    if (typeof req.query.code === "undefined") {
        throw "no query"
    }

    const verifCode = utils.genString();

    const accessToken = await utils.query(`
        SELECT *
        FROM access_token
        WHERE code="verifCode"`);

    if (accessToken.length != 0) {
        return;
    }

    try {
        (async () => {
            const api = `https://accounts.spotify.com/api/token?grant_type=authorization_code&client_id=0a53ae5438f24d0da272a2e663c615c3&client_secret=${creds.client_secret_spotify}&code=${req.query.code}&redirect_uri=https://kunszg.com/resolved`
            const spotifyToken = await got(api, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).json();

            const checkPremium = await got(`https://api.spotify.com/v1/me`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${spotifyToken.access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).json();

            await utils.query(`
                INSERT INTO access_token (access_token, refresh_token, premium, code, platform)
                VALUES (?, ?, ?, ?, "spotify")`,
                [spotifyToken.access_token, spotifyToken.refresh_token, ((checkPremium.product === "open") ? "N" : "Y"), verifCode]);
        })();
    } catch (err) {
        if (err.message === "Response code 400 (Bad Request)") {
            res.send('<body>Your code has expired, repeat the process.</body>');
        }

        if (err.message === "no query") {
            res.send('<body>Invalid code.</body>')
        }
    }

    let html = fs.readFileSync('./website/html/express_pages/spotifyResolve.html');

    html = html.toString();

    const page = new utils.Swapper(html, [{
        "code": verifCode
    }])

    res.send(page.template());


    return;
});

kb.on("whisper", async (username, user, message, self) => {
    if (self) return;

    const owner = (await utils.Get.user().owner())[0].username;

    kb.whisper(owner, `whisper to kbot: ${username}: ${message}`);

    if (message.split(' ')[0] === "verify-lastfm") {
        // check if user is banned from bot
        const checkBan = await utils.query(`
            SELECT *
            FROM ban_list
            WHERE user_id=?`,
            [user['user-id']]);

        if (checkBan.length != 0) {
            return;
        }

        const checkCode = await utils.query(`
            SELECT *
            FROM access_token
            WHERE code=?`,
            [message.split(' ')[1]]);

        if (checkCode.length === 0) {
            kb.whisper(username, 'Provided code is invalid.');
            return;
        }

        const checkUser = await utils.query(`
            SELECT *
            FROM access_token
            WHERE user=? AND platform="lastfm"`,
            [user['user-id']]);

        if (checkUser.length != 0) {
            kb.whisper(username, 'You are already registered for LastFM command.');
            await utils.query(`
                DELETE FROM access_token
                WHERE code=?`,
                [message.split(' ')[1]]);
            return;
        }

        await utils.query(`
            UPDATE access_token
            SET userName=?, user=?, code="lastfm"
            WHERE code=?`,
            [username.replace('#', ''), user['user-id'], message.split(' ')[1]]);

        kb.whisper(username, 'All done! You can now use the Lastfm command like that :) 👉 kb lastfm  or kb music. Aliases are: kb music [allow/disallow/unregister]');
        return;
    }

    if (message.split(' ')[0] === "verify-spotify") {
        // check if user is banned from bot
        const checkBan = await utils.query(`
            SELECT *
            FROM ban_list
            WHERE user_id=?`,
            [user['user-id']]);

        if (checkBan.length != 0) {
            return;
        }

        const checkCode = await utils.query(`
            SELECT *
            FROM access_token
            WHERE code=?`,
            [message.split(' ')[1]]);

        if (checkCode.length === 0) {
            kb.whisper(username, 'Provided code is invalid.');
            return;
        }

        const checkUser = await utils.query(`
            SELECT *
            FROM access_token
            WHERE user=? AND platform="spotify"`,
            [user['user-id']]);

        if (checkUser.length != 0) {
            kb.whisper(username, 'You are already registered for Spotify command.');
            await utils.query(`
                DELETE FROM access_token
                WHERE code=?`,
                [message.split(' ')[1]]);
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        await utils.query(`
            UPDATE access_token
            SET userName=?,
                user=?,
                code="Resolved",
                lastRenew=?
            WHERE code=?`,
            [username.replace('#', ''), user['user-id'], timestamp, message.split(' ')[1]]);

        kb.whisper(username, `All done! You can now use the Spotify command. If you have Spotify premium,
            check out command parameters under kb help spotify. Note that you can use these parameters
            the main command like: kb skip, kb vol 10 etc. To allow other users to check out your
            playing songs type "kb spotify allow"`);
        return;
    }
    return;
});

app.get("/commands", async (req, res) => {
    const Table = require('table-builder');
    const commands = await utils.query(`
        SELECT *
        FROM commands
        WHERE permissions < 5
        ORDER BY command
        ASC`);

    const tableData = [];
    for (let i=0; i<commands.length; i++) {
        const desc = commands[i].description.replace(" - ", " - <details><summary>[...] </summary>") + "</details>";

        let usage = commands[i].usage ?? "NULL";

        usage = usage.replace(/;/g, "<br>")

        tableData.push({
            "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
            "command": `<div class="table-contents" style="text-align: center;">${commands[i].command}</div>`,
            "cooldown": `<div class="table-contents" style="text-align: center;">${commands[i].cooldown/1000}s</div>`,
            "opt-out": `<div class="table-contents" style="text-align: center;">${(commands[i].optoutable === "Y") ? "✅" : "❌"}</div>`,
            "code": `<a href="https://kunszg.com/commands/code/${commands[i].command}">
                        <div class="code" style="font-family: 'Noto Sans', sans-serif; font-size: 13px;">
                                <img style="margin-top: 10px; margin-bottom: 5px;" src="https://i.imgur.com/1THd3GD.png" height="15" width="15">
                        </div>
                    </a>`,
            "usage": `<div class="table-contents usage-div"><span style="cursor: auto;">${usage}</span></div>`,
            "description": `<div class="table-contents"><div class="limiter">${desc}</div></div>`,
        })
    }

    const headers = {
        "ID": ` <div class="table-headers">ID</div> `,
        "command": ` <div class="table-headers">command</div> `,
        "cooldown": ` <div class="table-headers">cooldown</div> `,
        "opt-out": ` <div class="table-headers">opt-out</div> `,
        "code": ` <div class="table-headers">code</div> `,
        "usage": ` <div class="table-headers">usage</div> `,
        "description": ` <div class="table-headers">description</div> `,
    };

   res.send(
       `<!DOCTYPE html>
      	<html>
      		<head>
          		<title>commands</title>
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link rel="stylesheet" type="text/css" href="https://kunszg.com/style_commands.css">
      		</head>
      		<body style="background-color: #1a1a1a">
                <div style="color: lightgray;">
	          		${(new Table({'class': 'table-context'}))
					    .setHeaders(headers)
					    .setData(tableData)
					    .render()}
                </div>
			</body>
		</html>
	    `
    );

   return;
});

app.get("/commands/code/*", async (req, res) => {
    const query = req.url.split('/')[3];

    if (query) {
        try {
            const requestedFile = fs.readFileSync(`./lib/commands/${query}.js`);
            res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                        <link href="https://kunszg.com/prism.css" rel="stylesheet" />
                        <title>${query} command code</title>
                        <link rel="preconnect" href="https://fonts.gstatic.com">
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
                        <style>
                            .parameter {
                                color: orange;
                                font-style: italic;
                            }
                        </style>
                    </head>
                    <body style="background-color: #272822;">
                        <h3 style="color: gray;">Code for ${query} command</h3><br>
                        <pre style="font-size: 13px;" class="line-numbers"><code class="language-js">${requestedFile}</code></pre>
                        <script src="https://kunszg.com/prism.js"></script>
                    </body>
                </html>
                `);
        } catch (err) {
            res.send('<h3>Error: command not found</h3>');
        }
    } else {
        res.send('<h3>Error: command not found</h3>')
    }


    return;
});

/*  Data for random track command
*
*   credit to Musixmatch
*/
app.get("/genres", async (req, res) => {
    const genres = fs.readFileSync('./data/genres.json');

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link href="https://kunszg.com/prism.css" rel="stylesheet" />
                <title>genres</title>
            </head>
            <body style="background-color: #272822;">
                <h3 style="color: gray;">Genres list</h3><br>
                <pre style="font-size: 13px; color: gray;">You can use either a genre name or ID</pre><br>
                <pre style="font-size: 13px; color: gray;">example 1: kb rt 2</pre>
                <pre style="font-size: 13px; color: gray;">example 2: kb rt blues</pre><br>
                <pre><code style="font-size: 13px;" class="language-json">${genres}</code></pre>
                <script src="https://kunszg.com/prism.js"></script>
            </body>
        </html>
        `);


    return;
});

app.get("/randomemote", async (req, res) => {
    const randomemote = await utils.query(`
        SELECT *
        FROM emotes
        ORDER BY RAND()
        LIMIT 3`);

    res.send([
        {"emote": randomemote[0].emote, "emoteUrl": randomemote[0].url},
        {"emote": randomemote[1].emote, "emoteUrl": randomemote[1].url},
        {"emote": randomemote[2].emote, "emoteUrl": randomemote[2].url}
    ])
})

app.get("/api/channels", async (req, res) => {
    const Table = require('table-builder');

    const channels = await got("https://kunszg.com/api/channels?details=true").json()

    const headers = {
        "channelInternalId": "Channel ID",
        "channelName": "Name",
        "channelUid": "Channel Twitch UID",
        "channelStatus": "Status",
        "channelAdded": "Joined",
        "logTableSize": "Logs size",
        "logStatus": "Logs status",
        "commandsExecuted": "Commands used",
        "isBanphraseApiActive": "Banphrase API"
    };

    const data = [];

    for (let i = 0; i < channels.count; i++) {
        data.push({

        });
    }
});

app.get("/emotes", async (req, res) => {
    const Table = require('table-builder');


    const tableData = [];
    const tableDataRemoved = [];
    const headers = {
        "ID": " <div class='table-headers'>ID</div> ",
        "name": `<div class='table-headers'>name</div>`,
        "emote": " <div class='table-headers'>emote</div> ",
        "type": " <div class='table-headers'>type</div> ",
        "added": " <div class='table-headers'>added</div> "
    };

    const headersRemoved = {
        "ID": " <div class='table-headers'>ID</div> ",
        "name": `<div class='table-headers'>name</div>`,
        "emote": " <div class='table-headers'>emote</div> ",
        "type": " <div class='table-headers'>type</div> ",
        "removed": " <div class='table-headers'>removed</div> "
    };

    const homepage = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <title>emotes</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">

                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif">
                <link rel="stylesheet" type="text/css" href="https://kunszg.com/style_emotes.css">
                <link rel="stylesheet" href="https://kunszg.com/reset.css">
                <link rel="preconnect" href="https://fonts.gstatic.com">
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            </head>
            <body style="background-color: #1a1a1a" class="blockscroll">
                <div class="content">
                    <div class="logo">
                        <h7 class="white__logo__word">Emote</h7>
                        <h7 class="blue__logo__word"> checker</h7>
                    </div>
                    <div class="searchBox">
                        <form action="/emotes" class="searchBox2">
                            <input type="text" autofocus="autofocus" placeholder="Search for channel.." name="search" autocomplete="off" class="search__input">
                            <button type="submit" class="search__button">
                                <img src="./img/magnifier.png" height="20" width="20">
                            </button>
                        </form>
                    <div>
                    <div class="footer">
                        Emote checker is based on logs from ksyncbot
                    </div>
                    <div style="margin-top: 30%; margin-right: 10%; margin-left: 10%; margin-bottom: 10%">
                        <script>
                            function show_image(src, alt) {
                                const img = document.createElement("img");
                                img.src = src;
                                img.alt = alt;

                                img.style.position = "absolute";
                                img.style.top = document.body.clientHeight * Math.random()/1.2 + "px";
                                img.style.left = document.body.clientWidth * Math.random()/1.2 + "px";

                                document.body.appendChild(img);

                                function fadeOut(element) {
                                    let op = 1;  // initial opacity
                                    let timer = setInterval(function () {
                                        if (op <= 0.1){
                                            clearInterval(timer);
                                        }
                                        element.style.opacity = op;
                                        op -= 0.03;
                                    }, 100);
                                }

                                fadeOut(img)

                                setTimeout(() => {
                                    document.body.removeChild(img)
                                }, 3200);
                            }

                            fetch('https://kunszg.com/api/randomemote')
                                .then(response => response.json())
                                .then(data => {
                                        show_image(data[0].emoteUrl, data[0].emote);

                                        show_image(data[1].emoteUrl, data[1].emote);

                                        show_image(data[2].emoteUrl, data[2].emote);
                                })

                            setInterval(() => {
                                if (!document.hidden) {
                                    fetch('https://kunszg.com/api/randomemote')
                                        .then(response => response.json())
                                        .then(data => {
                                            setTimeout(() => {
                                                show_image(data[0].emoteUrl, data[0].emote);
                                            }, Math.floor(Math.random()*10)*1000);

                                            setTimeout(() => {
                                                show_image(data[1].emoteUrl, data[1].emote);
                                            }, Math.floor(Math.random()*10)*1000);

                                            setTimeout(() => {
                                                show_image(data[2].emoteUrl, data[2].emote);
                                            }, Math.floor(Math.random()*10)*1000);
                                        })
                                }
                            }, 3000);
                        </script>
                    </div>
                </div>
            </body>
        </html>
        `;

    if (!req.query.search) {
        res.send(homepage)
        return;
    }

    if ((await req.query?.search ?? false)) {
        const emotes = await utils.query(`
            SELECT *
            FROM emotes
            WHERE channel=?
            ORDER BY date
            DESC`,
            [(!req.query.search ? "asdf" : req.query.search.toLowerCase())]);

        const emotesRemoved = await utils.query(`
            SELECT *
            FROM emotes_removed
            WHERE channel=?
            ORDER BY date
            DESC`,
            [(!req.query.search ? "asdf" : req.query.search.toLowerCase())]);

        const formatDate = (timestamp) => {
            const time = Date.now() - Date.parse(timestamp);
            return `${utils.humanizeDuration(time/1000)} ago`;
        }

        class ModifyOutput {
            constructor(input) {
                this.input = input;
            }

            trimmer() {
                return (this.input.length > 20) ? `${this.input.substr(0, 20)}(...)` : this.input;
            }
        }
        if (!emotes.length) {
               res.send(homepage);
        }
        else {
            for (let i=0; i<emotes.length; i++) {
                const emoteName = new ModifyOutput(emotes[i].emote);

                let emoteCDN = "#";
                if (emotes[i].url != null) {
                    if (emotes[i].type === "bttv") {
                        emoteCDN = emotes[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '');
                    }
                    else if (emotes[i].type === "ffz") {
                        emoteCDN = `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`;
                    }
                    else if (emotes[i].type === "7tv") {
                        emoteCDN = `https://7tv.app/emotes/${emotes[i].sevenTvId}`;
                    }
                }

                tableData.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">
                            <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                ${emoteName.trimmer()}
                            </a>
                            </div>`,
                    "emote": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    <span title="${emotes[i].emote}">
                                        <img style="vertical-align: middle; margin-top: 4px; margin-bottom: 4px;" loading="lazy" src="${emotes[i].url}" alt="${emoteName.trimmer()}">
                                    </span>
                                </a>
                            </div>`,
                    "type": `<div class="table-contents" style="text-align: center;">${emotes[i].type}</div>`,
                    "added": `<div class="table-contents" style="text-align: center;">${formatDate(emotes[i].date)}</div>`
                })
            }
        }

        if (!emotesRemoved.length) {
            tableDataRemoved.push({
                "ID": `<div class="table-contents" style="text-align: center;">-</div>`,
                "name": `<div class="table-contents" style="text-align: center;">-</div>`,
                "emote": `<div class="table-contents" style="text-align: center;">-</div>`,
                "type": `<div class="table-contents" style="text-align: center;">-</div>`,
                "removed": `<div class="table-contents" style="text-align: center;">-</div>`
            });
        } else {
            for (let i=0; i<emotesRemoved.length; i++) {
                const emoteName = new ModifyOutput(emotesRemoved[i].emote);

                let emoteCDN = "#";

                if (emotesRemoved[i].url != null) {
                    if (emotesRemoved[i].type === "bttv") {
                        emoteCDN = emotesRemoved[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '');
                    }
                    else if (emotesRemoved[i].type === "ffz") {
                        emoteCDN = `https://www.frankerfacez.com/emoticon/${emotesRemoved[i].emoteId}-${emotesRemoved[i].emote}`;
                    }
                    else if (emotesRemoved[i].type === "7tv") {
                        emoteCDN = `https://7tv.app/emotes/${emotesRemoved[i].sevenTvId}`;
                    }
                }

                tableDataRemoved.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    ${emoteName.trimmer()}
                                </a>
                            </div>`,
                    "emote": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${emoteCDN}">
                                    <span title="${emotesRemoved[i].emote}">
                                        <img style="vertical-align: middle; margin-top: 4px; margin-bottom: 4px;" loading="lazy" src="${emotesRemoved[i].url}" alt="${emoteName.trimmer()}">
                                    </span>
                                </a>
                            </div>`,
                    "type": `<div class="table-contents" style="text-align: center;">${emotesRemoved[i].type}</div>`,
                    "removed": `<div class="table-contents" style="text-align: center;">${formatDate(emotesRemoved[i].date)}</div>`
                })
            }
        }
    }

    if (req.query.search) {
       /* res.send(
            `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>emotes</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta charset="UTF-8">
                    <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    <link rel="stylesheet" type="text/css" href="https://kunszg.com/style_emotes_table.css">
                </head>
                <body>
                </body>
            </html>
            `
            );
        */

        res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>emotes</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta charset="UTF-8">
                    <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                    <link rel="stylesheet" type="text/css" href="https://kunszg.com/style_emotes_table.css">
                    <link rel="preconnect" href="https://fonts.gstatic.com">
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
                    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
                    <style>
                        * {
                          font-family: "Noto Sans", sans-serif;
                        }

                        .searchBox {
                          text-align: center;
                        }

                        .search__input {
                          background-color: white;
                          padding: 13px 16px;
                          font-weight: 700;
                          color: #000;
                          border-radius: 5px 0px 0px 5px;
                          border-top-style: hidden;
                          border-right-style: hidden;
                          border-left-style: hidden;
                          border-bottom-style: hidden;
                        }

                        .search__button {
                          background-color: #3e91f2;
                          padding: 13px 13px 11px 13px;
                          margin-left: -4px;
                          border-top-style: hidden;
                          border-right-style: hidden;
                          border-left-style: hidden;
                          border-bottom-style: hidden;
                          border-radius: 0px 5px 5px 0px;
                        }

                        .footer {
                            text-align: center;
                            font-size: 12px;
                            font-weight: 700;
                            font-family: 'Noto Sans', sans-serif;
                            position: fixed;
                            text-align: center;
                            bottom: 1%;
                            width: 100%;
                            color: #666666;
                        }

                        textarea:focus, input:focus {
                            outline: none;
                        }

                        *:focus {
                            outline: none;
                        }
                    </style>
                </head>
                <body style="background-color: #1a1a1a">
                    <br>
                    <div style="text-align: center; color: white">
                        <strong><a style="color: inherit;" href="https://twitch.tv/${req.query.search.toLowerCase()}">${req.query.search.toLowerCase()}'s</a> emotes</strong>
                    </div>
                    <br>
                    <div class="searchBox">
                        <form action="/emotes" class="searchBox2">
                            <input type="text" autofocus="autofocus" placeholder="Search for channel.." name="search" autocomplete="off" class="search__input">
                            <button type="submit" class="search__button">
                                <img style="vertical-align: middle;" src="https://i.imgur.com/gQPOwPT.png" height="20" width="20">
                            </button>
                        </form>
                    <div>
                    <div style="text-align: center; margin-top: 15px;">
                        <div id="timer">
                        </div>
                    </div>
                    <script>
                        function lastUpdate() {
                            return (Date.now() - (Date.parse("${(await utils.query(`SELECT emotesUpdate FROM channels_logger WHERE channel="${req.query.search.toLowerCase()}"`))[0]?.emotesUpdate ?? new Date()} UTC")))/1000;
                        }

                        const secondsToDhms = (seconds) => {
                            seconds = Number(seconds);
                            const d = Math.floor(seconds / (3600*24));
                            const h = Math.floor(seconds % (3600*24) / 3600);
                            const m = Math.floor(seconds % 3600 / 60);
                            const s = Math.floor(seconds % 60);

                            const dDisplay = d > 0 ? d + " " : "";
                            const hDisplay = h > 0 ? h + 'h' + " " : "";
                            const mDisplay = m > 0 ? m + 'm' + " " : "";
                            const sDisplay = s > 0 ? s + 's' : '0' + s + 's';
                            return dDisplay + hDisplay + mDisplay + sDisplay;
                        }

                        setInterval(() => {
                            const timer = '<i style="color:white">LAST UPDATE</i><div style="text-align: center; color: white; font-size: 20px;">'+secondsToDhms(lastUpdate())+'<i style="color:white; font-size:15px; font-family: "Noto Sans", sans-serif;"> AGO</i></div>';

                            document.getElementById("timer").innerHTML = timer;
                        }, 1000)
                    </script>
                    <div style="color: lightgray; float: left;">
                        <strong style="color: white; text-align: center;">USABLE EMOTES</strong><br>
                        <input type="text" id="search" placeholder="Type to search" autocomplete="off">
                        <br>
                        ${(new Table({'class': 'table-context', 'id': "added-emotes-table"}))
                            .setHeaders(headers)
                            .setData(tableData)
                            .render()}
                    </div>
                    <div style="margin-top: -1px; color: lightgray; float: right;">
                        <strong style="color: white; text-align: center;">REMOVED EMOTES</strong><br>
                        <input type="text" id="search2" placeholder="Type to search" autocomplete="off">
                        <br>
                        ${(new Table({'class': 'table-context', 'id': "removed-emotes-table"}))
                            .setHeaders(headersRemoved)
                            .setData(tableDataRemoved)
                            .render()}
                    </div>
                    <script>
                        let $rows = $('#added-emotes-table tbody tr');
                        $('#search').keyup(function() {
                            let val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();

                            $rows.show().filter(function() {
                                let text = $(this).text().replace(/\s+/g, ' ').toLowerCase();
                                return !~text.indexOf(val);
                            }).hide();
                        });

                        let $rows2 = $('#removed-emotes-table tbody tr');
                        $('#search2').keyup(function() {
                            let val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();

                            $rows2.show().filter(function() {
                                let text = $(this).text().replace(/\s+/g, ' ').toLowerCase();
                                return !~text.indexOf(val);
                            }).hide();
                        });
                    </script>
                    <div class="footer">
                        Emote checker is based on logs from ksyncbot
                    </div>
                </body>
            </html>`
        );
    }

    return;
});

// kunszg.com/api/stats
app.get("/stats", async (req, res) => {
    const modules = await utils.query(`SELECT * FROM stats`);

    const getModuleData = (input) => {
        const moduleData = modules.filter(i => i.type === 'module' && i.sha === input);
        return Date.parse(moduleData[0].date)
    }

    const executions = await utils.query('SELECT count FROM stats WHERE type="statsApi" AND sha="commandExecs"');
    const usersLogged = await utils.query('SELECT count FROM stats WHERE type="statsApi" AND sha="totalUsers"');
    const channels = await utils.query("SELECT * FROM channels");

    const checkIfLive = channels.filter(i => i.channel === "kunszg")[0].status === "live";

    const commits = shell.execSync('sudo git rev-list --count master');
    const lines = shell.execSync(`find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`);

    const uptimeData = (fs.readFileSync("./data/temp_api_uptime.txt")).toString();
    const uptime = Date.now() - Math.trunc(Number(uptimeData) * 1000);

    const restartData = (fs.readFileSync("./data/temp_api_restarting.txt")).toString();
    const isRestarting = (0.9 * channels.length) > Math.trunc((Date.now() - Number(restartData))/1000);

    res.send({
        "modules": {
            "remindersLastSeen": getModuleData('reminders'),
            "loggerLastSeen": getModuleData('logger'),
            "apiLastSeen": getModuleData('api'),
            "botLastSeen": getModuleData('bot')
        },
        "bot": {
            "isRestarting": isRestarting,
            "codeUptime": uptime,
            "linesOfCode": Number(lines.toString().split(" ")[1]),
            "usersLogged": Number(usersLogged[0].count),
            "commandExecutions": Number(executions[0].count)
        },
        "github": {
            "commits": Number(commits)
        },
        "twitch": {
            "isAuthorLive": checkIfLive
        }
    });


    return;
});

// kunszg.com/commands/code
app.get("/commands/code", async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta http-equiv="refresh" content = "0; url=https://kunszg.com/commands" />
            </head>
        </html>
        `);
});

app.listen(process.env.PORT || 8080, '0.0.0.0');

const statusCheck = async() => {
	await utils.query(`
		UPDATE stats
		SET date=?
		WHERE type="module" AND sha="api"`,
        [new Date().toISOString().slice(0, 19).replace('T', ' ')])
}
statusCheck();
setInterval(()=>{statusCheck()}, 60000);