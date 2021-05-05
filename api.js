#!/usr/bin/env node
'use strict';

const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const got = require('got');
const creds = require('./lib/credentials/config.js');
const utils = require('./lib/utils/utils.js');
const bodyParser = require('body-parser');

const app = express();

app.enable('trust proxy')

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
        username: 'kunszgbot',
        password: creds.oauth,
    }
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

class Swapper {
    constructor(html, repl) {
        this.html = html;
        this.value = repl[0];
        this.valueKeys = Object.keys(repl[0]).map(i => `%{${i}}`);
    }

    template() {
        for (let i = 0; i < this.valueKeys.length; i++) {
            this.html = this.html.replace(
                this.valueKeys[i], this.value[this.valueKeys[i].replace(/^%{/, '').replace(/}$/, '')]
                );
        }
        return this.html;
    }
}

const conLog = async(req) => {
    await utils.query(`
        INSERT INTO web_connections (url, method, protocol, date)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.originalUrl, req.method, req.protocol]);
}

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

    const page = new Swapper(html, [{
        "execs": execCount[0].count,
        "users": userCount[0].count
    }]);

    res.send(page.template());

    await conLog(req);

    return;
});

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

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

const secret = creds.webhook_github_secret;

const createComparisonSignature = (body) => {
    const hmac = crypto.createHmac('sha256', secret);
    const self_signature = hmac.update(JSON.stringify(body)).digest('hex');
    return `sha256=${self_signature}`; // shape in GitHub header
}

const compareSignatures = (signature, comparison_signature) => {
    const source = Buffer.from(signature);
    const comparison = Buffer.from(comparison_signature);
    return crypto.timingSafeEqual(source, comparison); // constant time comparison
}

const verifyGithubPayload = (req, res, next) => {
    const { headers, body } = req;

    const signature = headers['X-Hub-Signature-256'];
    const comparison_signature = createComparisonSignature(body);

    if (!compareSignatures(signature, comparison_signature)) {
        return res.status(401).send('Mismatched signatures');
    }

    const { action, ...payload } = body;
    req.event_type = headers['X-GitHub-Event']; // one of: https://developer.github.com/v3/activity/events/types/
    req.action = action;
    req.payload = payload;
    next();
}

app.post("/webhooks/github", verifyGithubPayload, async (req, res) => {
    const payload = req.body.payload

    console.log(payload)
    if (req.headers["x-github-event"] === "push") {
    }

    res.status(200);
    res.send("OK");
});

app.get("/countdown", async (req, res) => {
    try {
        await conLog(req);

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

        const page = new Swapper(html, [{
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

    const page = new Swapper(html, [{
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

    await conLog(req);

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

    const page = new Swapper(html, [{
        "code": verifCode
    }])

    res.send(page.template());

    await conLog(req);

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

    const page = new Swapper(html, [{
        "code": verifCode
    }])

    res.send(page.template());

    await conLog(req);

    return;
});

kb.on("whisper", async (username, user, message, self) => {
    if (self) return;
    kb.whisper('kunszg', `whisper to kbot: ${username}: ${message}`);

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
        tableData.push({
                "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                "command": `<div class="table-contents" style="text-align: center;">${commands[i].command}</div>`,
                "cooldown": `<div class="table-contents" style="text-align: center;">${commands[i].cooldown/1000}s</div>`,
                "opt-out": `<div class="table-contents" style="text-align: center;">${(commands[i].optoutable === "Y") ? "yes" : "no"}</div>`,
                "code": `<a href="https://kunszg.com/commands/code/${commands[i].command}">
                            <div class="code" style="font-family: 'Noto Sans', sans-serif; font-size: 13px;">
                                    <img style="margin-top: 10px;" src="https://i.imgur.com/1THd3GD.png" height="15" width="15">
                            </div>
                        </a>`,
                "description": `<div class="table-contents" style="margin-right: 50px; margin-left: 5px;">${commands[i].description}</div>`
            })
    }

    const headers = {
        "ID": " <div class='table-headers'>ID</div> ",
        "command": " <div class='table-headers'>command</div> ",
        "cooldown": " <div class='table-headers'>cooldown</div> ",
        "opt-out": " <div class='table-headers'>opt-out</div> ",
        "code": " <div class='table-headers'>code</div> ",
        "description": " <div class='table-headers'>description</div> "
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

   await conLog(req);

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

    await conLog(req);

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

    await conLog(req);

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

app.get("/emotes", async (req, res) => {
    const Table = require('table-builder');

    await conLog(req);

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
                        <div>
                            <form action="/emotes" class="searchBox2">
                                <input type="text" autofocus="autofocus" placeholder="Search for channel.." name="search" autocomplete="off" class="search__input">
                                <button type="submit" class="search__button">
                                    <img src="./img/magnifier.png" height="20" width="20">
                                </button>
                            </form>
                        <div>
                    <div>
                    <div class="footer">
                        Emote checker is based on logs from Kunszgbot
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
        } else {

            for (let i=0; i<emotes.length; i++) {
                const emoteName = new ModifyOutput(emotes[i].emote);
                tableData.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">
                            <a target="_blank" style="color: inherit; text-decoration: none;" href="${(emotes[i].url === null) ? '#' : ((emotes[i].type === "bttv") ?
                                    emotes[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') :
                                    `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`)}">
                                ${emoteName.trimmer()}
                            </a>
                            </div>`,
                    "emote": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${(emotes[i].url === null) ? '#' : ((emotes[i].type === "bttv") ?
                                    emotes[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') :
                                    `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`)}">
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

                tableDataRemoved.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${(emotesRemoved[i].url === null) ? '#' : ((emotesRemoved[i].type === "bttv") ?
                                        emotesRemoved[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') :
                                        `https://www.frankerfacez.com/emoticon/${emotesRemoved[i].emoteId}-${emotesRemoved[i].emote}`)}">
                                    ${emoteName.trimmer()}
                                </a>
                            </div>`,
                    "emote": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" style="color: inherit; text-decoration: none;" href="${(emotesRemoved[i].url === null) ? '#' : ((emotesRemoved[i].type === "bttv") ?
                                    emotesRemoved[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') :
                                    `https://www.frankerfacez.com/emoticon/${emotesRemoved[i].emoteId}-${emotesRemoved[i].emote}`)}">
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

        res.send(
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
                        <div>
                            <form action="/emotes" class="searchBox2">
                                <input type="text" autofocus="autofocus" placeholder="Search for channel.." name="search" autocomplete="off" class="search__input">
                                <button type="submit" class="search__button">
                                    <img style="vertical-align: middle;" src="https://i.imgur.com/gQPOwPT.png" height="20" width="20">
                                </button>
                            </form>
                        <div>
                    <div>
                    <br>
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
                        Emote checker is based on logs from Kunszgbot
                    </div>
                </body>
            </html>
            `
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

    const executions = await utils.query(`
        SELECT MAX(ID) AS count
        FROM executions`);

    const statusData = await utils.query(`
        SELECT *
        FROM channels
        WHERE channel="kunszg"`);

    const checkIfLive = statusData[0].status === "live";

    const usersLogged = await utils.query(`
        SELECT count(id) AS count
        FROM user_list`);

    const shell = require('child_process');
    const commits = shell.execSync('sudo git rev-list --count master');

    const uptime = Date.now() - Math.trunc(process.uptime() * 1000);

    res.send({
        "modules": {
            "remindersLastSeen": getModuleData('reminders'),
            "loggerLastSeen": getModuleData('logger'),
            "apiLastSeen": getModuleData('api'),
            "botLastSeen": getModuleData('bot')
        },
        "bot": {
            "codeUptime": uptime,
            "usersLogged": usersLogged[0].count,
            "commandExecutions": executions[0].count
        },
        "github": {
            "commits": Number(commits)
        },
        "twitch": {
            "isAuthorLive": checkIfLive
        }
    });

    await conLog(req);

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

// kunszg.com/api/channels
const apiDataChannels = () => {
	app.get("/channels", async (req, res) => {
        let channelList = await utils.query(`SELECT *FROM channels`);

        channelList = channelList.map(i => i.channel);

	 	res.send({
	 		"data": channelList
        });

        await conLog(req);

        return;
	});
}
apiDataChannels();
setInterval(()=>{apiDataChannels()}, 600000);

const server = app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    const port = server.address().port;
    console.log('app running on port', port);
});

const statusCheck = async() => {
		await utils.query(`
			UPDATE stats
			SET date=?
			WHERE type="module" AND sha="api"`,
            [new Date().toISOString().slice(0, 19).replace('T', ' ')])
	}
statusCheck();
setInterval(()=>{statusCheck()}, 60000);
