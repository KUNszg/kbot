const express = require("express");
const app = express();
const api = require('./config.js');
const mysql = require('mysql2');
const custom = require('./lib/utils/functions.js');

const con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: api.db_pass,
	database: "kbot"
});

con.on('error', (err) => {
    console.log(err)
});

con.connect((err) => {
	if (err) {
		console.log('Database connection error in express')
	}
});

const doQuery = (query) => new Promise((resolve, reject) => {
    con.execute(query, (err, results, fields) => {
        if (err) {
        	return;
        } else {
            resolve(results);
        }
    });
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
        password: api.oauth,
    }
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

const sleepGlob = (milliseconds) => {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleepGlob(1000)

app.get("/spotify", async (req, res, next) => {
    const userCount = await custom.doQuery(`
        SELECT COUNT(*) AS count
        FROM access_token
        WHERE platform="spotify" AND user IS NOT NULL
        `);

    const execCount = await custom.doQuery(`
        SELECT COUNT(*) AS count
        FROM executions
        WHERE command LIKE "%spotify%"
        `);

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Spotify integration</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link rel="stylesheet" type="text/css" href="https://kunszg.xyz/style_spotify.css">
            </head>
            <body style="background-color: #1a1a1a">
                <div class="animate-bottom">
                    <strong style="color: gray; font-family: 'Noto Sans', sans-serif;">Click the button below and log into your Spotify</strong><br>
                    <i style="color: gray; font-family: 'Noto Sans', sans-serif;">this command has been used ${execCount[0].count} times by ${userCount[0].count} users so far...</i>
                    <a class="commands" href="https://accounts.spotify.com/authorize?client_id=0a53ae5438f24d0da272a2e663c615c3&response_type=code&redirect_uri=https://kunszg.xyz/resolved&scope=user-modify-playback-state%20user-read-playback-position%20user-top-read%20user-read-playback-state%20user-read-recently-played%20user-read-currently-playing%20user-read-email%20user-read-private" target="_self">
                        <br>
                        <button style="border: none; background: none" class="button button1">
                            <div class="button1">
                                <pre style="margin-bottom:17px;">SPOTIFY-KUNSZGBOT<br>INTEGRATION</pre>
                                <img src="https://i.imgur.com/WyFrUHi.png" height="60px">
                            </div>
                        </button>
                    </a>
                </div>
            </body>
        </html>
        `);
})

app.get("/resolved", async (req, res, next) => {
    if (typeof req.query.code === "undefined") {
        throw "no query"
    }

    const genString = (length) => {
       let result = '';
       const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
       const charactersLength = characters.length;
       for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
    }

    const verifCode = genString(15);

    const accessToken = await doQuery(`
        SELECT *
        FROM access_token
        WHERE code="verifCode"
        `);

    if (accessToken.length != 0) {
        return;
    }

    try {
        (async () => {
            const got = require('got');

            const api = `https://accounts.spotify.com/api/token?grant_type=authorization_code&client_id=0a53ae5438f24d0da272a2e663c615c3&client_secret=85c458f0cc4f4fb18b8e8ea843009890&code=${req.query.code}&redirect_uri=https://kunszg.xyz/resolved`
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

            await custom.doQuery(`
                INSERT INTO access_token (access_token, refresh_token, platform, premium, code)
                VALUES ("${spotifyToken.access_token}", "${spotifyToken.refresh_token}", "spotify", "${(checkPremium.product === "open") ? "N" : "Y"}", "${verifCode}")
                `);
        })();
    } catch (err) {
        if (err.message === "Response code 400 (Bad Request)") {
            res.send('<body>Your code has expired, repeat the process.</body>');
        }

        if (err.message === "no query") {
            res.send('<body>Invalid code.</body>')
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <title>Successfully resolved</title>
            </head>
            <body style="background-color: #1a1a1a">
                <div style="vertical-align: middle; text-align: center; margin-top: 10%;">
                    <p style="color: lightgray; font-family: 'Noto Sans', sans-serif;">Copy the code below and whisper it to kunszgbot to finish the authentication.</p>
                    <input style="font-family: 'Noto Sans', sans-serif; text-align: center; background-color: lightgray; border: solid lightgray 4px;" size="35px" type="text" readonly="readonly" value="verify-spotify ${verifCode}" autofocus="autofocus" id="myInput">
                    <br>
                    <br>
                    <button onclick="myFunction()" style="font-family: 'Noto Sans', sans-serif;">Copy code</button>
                </div>
                <script>
                    function myFunction() {
                      /* Get the text field */
                      var copyText = document.getElementById("myInput");

                      /* Select the text field */
                      copyText.select();
                      copyText.setSelectionRange(0, 99999); /*For mobile devices*/

                      /* Copy the text inside the text field */
                      document.execCommand("copy");
                    }
                </script>
            </body>
        </html>
        `);
    return;
});

kb.on("whisper", async (username, user, message, self) => {
    if (self) return;
    if (message.split(' ')[0] === "verify-spotify") {
        // check if user is banned from bot
        const checkBan = await custom.doQuery(`
            SELECT *
            FROM ban_list
            WHERE user_id="${user['user-id']}"
            `);

        if (checkBan.length != 0) {
            return;
        }

        const checkCode = await custom.doQuery(`
            SELECT *
            FROM access_token
            WHERE code="${message.split(' ')[1]}"
            `);

        if (checkCode.length === 0) {
            kb.whisper(username, 'Provided code is invalid.');
            return;
        }

        const checkUser = await custom.doQuery(`
            SELECT *
            FROM access_token
            WHERE user="${user['user-id']}"
            `);

        if (checkUser.length != 0) {
            kb.whisper(username, 'You are already registered for this command.');
            await custom.doQuery(`
                DELETE FROM access_token
                WHERE code="${message.split(' ')[1]}"
                `);
            return;
        }

        const checkIfUserRegisteredSpotify = await custom.doQuery(`
            SELECT *
            FROM access_token
            WHERE platform="lastfm" AND user="${user['user-id']}"
            `);
        if (checkIfUserRegisteredSpotify.length != 0) {
            kb.whisper(username.replace('#', ''), 'you are already registered for Lastfm command. At the moment you can either register for Lastfm or Spotify, not both at the same time.');
            await custom.doQuery(`
                DELETE FROM access_token
                WHERE code="${message.split(' ')[1]}"
                `);
            return;
        }

        await custom.doQuery(`
            UPDATE access_token
            SET userName="${username.replace('#', '')}", user="${user['user-id']}", code="Resolved"
            WHERE code="${message.split(' ')[1]}"
            `);

        kb.whisper(username, `All done! You can now use the Spotify command. If you have Spotify premium,
            check out command parameters under "kb help spotify", also note that you can use these parameters
            like: "kb skip", "kb vol 10", "kb shuffle true" etc.`);
        return;
    }
    return;
});

app.get("/commands", async (req, res, next) => {
    const Table = require('table-builder');
    const commands = await doQuery(`
        SELECT *
        FROM commands
        ORDER BY command
        ASC
        `);

    const tableData = [];
    for (let i=0; i<commands.length; i++) {
        tableData.push({
                "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                "command": `<div class="table-contents" style="text-align: center;">${commands[i].command}</div>`,
                "cooldown": `<div class="table-contents" style="text-align: center;">${commands[i].cooldown/1000}s</div>`,
                "opt-out": `<div class="table-contents" style="text-align: center;">${(commands[i].optoutable === "Y") ? "yes" : "no"}</div>`,
                "code": `<a href="https://kunszg.xyz/commands/code/${commands[i].command}">
                            <div class="code" style="font-family: 'Noto Sans', sans-serif; font-size: 13px;">
                                    <img style="margin-top: 10px;" src="https://i.nuuls.com/Ie4gN.png" height="15" width="15">
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
                <link rel="stylesheet" type="text/css" href="https://kunszg.xyz/style_commands.css">
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
});

app.get("/commands/code/*", async (req, res, next) => {
    const query = req.url.split('/')[3];

    if (query) {
        const fs = require('fs');
        try {
            const requestedFile = fs.readFileSync(`./lib/commands/${query}.js`);
            res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                        <link href="https://kunszg.xyz/prism.css" rel="stylesheet" />
                        <title>${query} command code</title>
                    </head>
                    <body style="background-color: #272822;">
                        <h3 style="color: gray;">Code for ${query} command</h3><br>
                        <pre style="font-size: 13px;" class="line-numbers"><code class="language-js">${requestedFile}</code></pre>
                        <script src="https://kunszg.xyz/prism.js"></script>
                    </body>
                </html>
                `);
        } catch (err) {
            res.send('<h3>Error: command not found</h3>');
        }

    } else {
        res.send('<h3>Error: command not found</h3>')
    }
});

/*  Data for random track command
*
*   credit to Musixmatch
*/
app.get("/genres", async (req, res, next) => {
    const fs = require('fs');
    const genres = fs.readFileSync('./data/genres.json');

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link href="https://kunszg.xyz/prism.css" rel="stylesheet" />
                <title>genres</title>
            </head>
            <body style="background-color: #272822;">
                <h3 style="color: gray;">Genres list</h3><br>
                <pre style="font-size: 13px; color: gray;">You can use either a genre name or ID</pre><br>
                <pre style="font-size: 13px; color: gray;">example 1: kb rt 2</pre>
                <pre style="font-size: 13px; color: gray;">example 2: kb rt blues</pre><br>
                <pre><code style="font-size: 13px;" class="language-json">${genres}</code></pre>
                <script src="https://kunszg.xyz/prism.js"></script>
            </body>
        </html>
        `);
});

app.get("/emotes", async (req, res, next) => {
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
        "type": " <div class='table-headers'>type</div> ",
        "removed": " <div class='table-headers'>removed</div> "
    };

    if (await req.query?.search ?? false) {
        const emotes = await doQuery(`
            SELECT *
            FROM emotes
            WHERE channel="${req.query.search.toLowerCase()}"
            ORDER BY date
            DESC
            `);

        const emotesRemoved = await doQuery(`
            SELECT *
            FROM emotes_removed
            WHERE channel="${req.query.search.toLowerCase()}"
            ORDER BY date
            DESC
            `);

        if (!emotes.length) {
            tableData.push({
                "ID": `<div class="table-contents" style="text-align: center;">-</div>`,
                "name": `<div class="table-contents" style="text-align: center;">-</div>`,
                "emote": `<div class="table-contents" style="text-align: center;">-</div>`,
                "type": `<div class="table-contents" style="text-align: center;">-</div>`,
                "added": `<div class="table-contents" style="text-align: center;">-</div>`
            });
        } else {
            const formatDate = (timestamp) => {
                const time = Date.now() - Date.parse(timestamp);
                // convert to days
                if(time > 172800000) {
                    return `${custom.secondsToDhm(time/1000)} ago`;
                }
                // convert to hours
                return `${custom.format(time/1000)} ago`
            }

            for (let i=0; i<emotes.length; i++) {
                tableData.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">${emotes[i].emote}</div>`,
                    "emote": `<div class="table-contents" style="text-align: center;">
                                <a target="_blank" href="${(emotes[i].type === "bttv") ?
                                    emotes[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') :
                                    `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`}">
                                    <span title="${emotes[i].emote}">
                                        <img src="${emotes[i].url}" alt="${emotes[i].emote}">
                                    </span>
                                </a>
                            </div>`,
                    "type": `<div class="table-contents" style="text-align: center;">${emotes[i].type}</div>`,
                    "added": `<div class="table-contents" style="text-align: center;">${(Date.parse(emotes[i].date) < 1594764720000) ? "*" : formatDate(emotes[i].date)}</div>`
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
            const formatDate = (timestamp) => {
                const time = Date.now() - Date.parse(timestamp);
                // convert to days
                if(time > 172800000) {
                    return `${custom.secondsToDhm(time/1000)} ago`;
                }
                // convert to hours
                return `${custom.format(time/1000)} ago`
            }

            for (let i=0; i<emotesRemoved.length; i++) {
                tableDataRemoved.push({
                    "ID": `<div class="table-contents" style="text-align: center;">${i+1}</div>`,
                    "name": `<div class="table-contents" style="text-align: center;">${emotesRemoved[i].emote}</div>`,
                    "type": `<div class="table-contents" style="text-align: center;">${emotesRemoved[i].type}</div>`,
                    "removed": `<div class="table-contents" style="text-align: center;">${formatDate(emotesRemoved[i].date)}</div>`
                })
            }
        }
    }
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
                <link rel="stylesheet" type="text/css" href="https://kunszg.xyz/style_emotes.css">
            </head>
            <body style="background-color: #1a1a1a">
                <br><br>
                <form class="example" action="emotes">
                    <input type="text" placeholder="${(typeof req.query.search === "undefined") ? "Search for channel.." : req.query.search}" name="search">
                    <button type="submit"></button>
                </form>
                <br>
                <strong style="color: lightgray;">* - emote added before my logs</strong>
                <br><br>
                <div style="color: lightgray;">
                    <!-- <button class="table-button" onClick="toggleTable2()">Added emotes</button> -->
                    <!-- <button style="margin-left: 5px;" class="table-button" onClick="toggleTable()">Removed emotes</button> -->
                    ${(new Table({'class': 'table-context', 'id': "added-emotes-table"}))
                        .setHeaders(headers)
                        .setData(tableData)
                        .render()}
                    ${(new Table({'class': 'hidden', 'id': "removed-emotes-table"}))
                        .setHeaders(headersRemoved)
                        .setData(tableDataRemoved)
                        .render()}
                </div>
                <script>
                    toggleTable () => {
                        document.getElementById("removed-emotes-table").classList.toggle("hidden");
                    }

                    toggleTable2 () => {
                        document.getElementById("added-emotes-table").classList.toggle("hidden");
                    }
                </script>
            </body>
        </html>
        `
    );
});

// kunszg.xyz/api/stats
app.get("/stats", async (req, res, next) => {
    const modules = await custom.doQuery(`
        SELECT *
        FROM stats
        `);

    const getModuleData = (input) => {
        const moduleData = modules.filter(i => i.type === 'module' && i.sha === input);
        return Date.parse(moduleData[0].date)
    }

    const executions = await custom.doQuery(`
        SELECT MAX(ID) AS count
        FROM executions
        `);

    const statusData = await custom.doQuery(`
        SELECT *
        FROM channels
        WHERE channel="kunszg"
        `);
    const checkIfLive = statusData[0].status === "live";

    const usersLogged = await custom.doQuery(`
        SELECT count(id) AS count
        FROM user_list
        `);

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
});

// kunszg.xyz/commands/code
app.get("/commands/code", async (req, res, next) => {
    res.send(`<!DOCTYPE html>
                <html>
                    <head>
                        <meta http-equiv="refresh" content = "0; url=https://kunszg.xyz/commands" />
                    </head>
                </html>
            `);
});

// kunszg.xyz/api/channels
const apiDataChannels = () => {
	app.get("/channels", async (req, res, next) => {
        let channelList = await custom.doQuery(`
            SELECT *
            FROM channels
            `);

        channelList = channelList.map(i => i.channel);

	 	res.send({
	 		"data": channelList
        });
	});
}
apiDataChannels();
setInterval(()=>{apiDataChannels()}, 600000);

const server = app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    const port = server.address().port;
    console.log('app running on port', port);
});

const statusCheck = async() => {
		await doQuery(`
			UPDATE stats
			SET date="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
			WHERE type="module" AND sha="api"
			`)
	}
statusCheck();
setInterval(()=>{statusCheck()}, 60000);