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
con.on('error', (err) => {console.log(err)});
con.connect((err) => {
	if (err) {
		console.log('Database connection error in express!')
	} else {
		console.log("Database connected in express!");
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

const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results, fields) => {
        if (err) {
        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
			const insert = [JSON.stringify(err), new Date()];
			con.query(mysql.format(sql, insert),
				(error, results, fields) => {
					if (error) {
						console.log(error)
						reject(error)
					} else {
						resolve(results)
					}
				})
            reject(err);
        }
        else {
            resolve(results);
        }
    });
});

const channelList = [];
const channelOptions = [];

const sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
sleep(500)

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
    },
    channels: ['supinic', 'kunszg'],
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

const res = async() => {
	channelList.push(await getChannels());
	await channelList[0].forEach(i => channelOptions.push(i.channel))
}
res();
// setInterval(()=>{channelList.length = 0; channelOptions.length = 0; res();}, 3600000)

const sleepGlob = (milliseconds) => {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleepGlob(1000)

const msgCount = [];
kb.on('chat', (channel, message) => {
    msgCount.push({'channel': channel.replace('#', ''), 'message':'add'})
});

app.get("/spotify", async (req, res, next) => {
    res.send(`
        <!doctype html>
        <html>
            <head>
                <title>commands</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <style>
                    .button {
                        background-color: #4CAF50; /* Green */
                        border: none;
                        color: white;
                        padding: 14px 28px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 20px;
                        margin: 4px 2px;
                        transition-duration: 0.3s;
                        cursor: pointer;
                    }

                    .button1 {
                        color: white;
                    }

                    .commands:link, .commands:visited {
                        text-decoration: none;
                    }

                    .animate-bottom {
                        vertical-align: middle;
                        text-align: center;
                        position: relative;
                        -webkit-animation-name: animatebottom;
                        -webkit-animation-duration: 1s;
                        animation-name: animatebottom;
                        animation-duration: 1s;
                        margin-top: 10%;
                    }

                    @-webkit-keyframes animatebottom {
                        from { bottom:-100px; opacity:0 }
                        to { bottom:0px; opacity:1 }
                    }

                    @keyframes animatebottom {
                        from{ bottom:-100px; opacity:0 }
                        to{ bottom:0; opacity:1 }
                    }

                    .button1:hover {
                        transform: scale(1.11, 1.11);
                        transition-duration: 0.3s;
                    }
                </style>
            </head>
            <body style="background-color: #1a1a1a">
                <div class="animate-bottom">
                    <strong style="color: gray; font-family: 'Noto Sans', sans-serif;">Click the button below and log into your Spotify</strong>
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
            kb.whisper('kunszg', spotifyToken.refresh_token)
            await custom.doQuery(`
                INSERT INTO access_token (refresh_token, platform, premium, code)
                VALUES ("${spotifyToken.refresh_token}", "spotify", ${(checkPremium.product === "open") ? "N" : "Y"}, "${verifCode}")
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
        <!doctype html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <title>Successfully resolved</title>
            </head>
            <body style="background-color: #1a1a1a">
                <div style="vertical-align: middle; text-align: center; margin-top: 10%;">
                    <input style="text-align: center; background-color: lightgray; border: solid lightgray 4px;" size="35px" type="text" readonly="readonly" value="verify-spotify ${verifCode}" autofocus="autofocus" id="myInput">
                    <br>
                    <br>
                    <button onclick="myFunction()">Copy code</button>
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
})

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
                "description": `<div class="table-contents" style="margin-right: 50px; margin-left: 5px;">${commands[i].description}</div>`
            })
    }

    const headers = {
        "ID": " <div class='table-headers'>ID</div> ",
        "command": " <div class='table-headers'>command</div> ",
        "cooldown": " <div class='table-headers'>cooldown</div> ",
        "opt-out": " <div class='table-headers'>opt-out</div> ",
        "description": " <div class='table-headers'>description</div> "
    };

   res.send(
       `<!doctype html>
      	<html>
      		<head>
          		<title>commands</title>
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <style>
                    .table-contents {
                        margin-right: 5px;
                        margin-left: 5px;
                        font-family: 'Noto Sans', sans-serif;
                        font-size: 13px;
                    }

                    .table-headers {
                        margin-left: 5px;
                        margin-right: 5px;
                        border-bottom: solid white 1px;
                        font-family: 'Noto Sans', sans-serif;
                        font-size: 14px;
                    }

                    .table-context {
                        width: 100%;
                        height: 100%;
                    }

                    td, th {
                        white-space: nowrap;
                    }

                    tr {
                        line-height: 30px;
                    }

                    tr:nth-child(odd) {
                        background-color: #202020;
                    }

                    tr:nth-child(even) {
                        background-color: #2c2c2c;
                    }
                </style>
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

    if (typeof await req.query != "undefined") {
        const emotes = await doQuery(`
            SELECT *
            FROM emotes
            WHERE channel="${(typeof req.query.search === "undefined") ? req.query.search : req.query.search.toLowerCase()}"
            ORDER BY date
            DESC
            `);

        const emotesRemoved = await doQuery(`
            SELECT *
            FROM emotes_removed
            WHERE channel="${(typeof req.query.search === "undefined") ? req.query.search : req.query.search.toLowerCase()}"
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
                    "emote": `<div class="table-contents" style="text-align: center;"><a target="_blank" href="${(emotes[i].type === "bttv") ? emotes[i].url.replace('https://cdn.betterttv.net/emote/', 'https://betterttv.com/emotes/').replace('/1x', '') : `https://www.frankerfacez.com/emoticon/${emotes[i].emoteId}-${emotes[i].emote}`}"><span title="${emotes[i].emote}"><img src="${emotes[i].url}" alt="${emotes[i].emote}"></span></a></div>`,
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
        <!doctype html>
        <html>
            <head>
                <title>emotes</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta charset="UTF-8">
                <link rel="icon" type="image/png" href="https://i.imgur.com/Tyf3qyg.gif"/>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                <style>
                    * {
                      box-sizing: border-box;
                    }

                    /* Style the search field */
                    form.example input[type=text] {
                      padding: 10px;
                      font-size: 15px;
                      border: 1px solid grey;
                      float: left;
                      background: #f1f1f1;
                      height: 25px;
                      height: 5%
                      width: 20%
                    }

                    /* Style the submit button */
                    form.example button {
                      float: left;
                      padding: 10px;
                      background: #2196F3;
                      color: white;
                      font-size: 15px;
                      border: 1px solid grey;
                      border-left: none; /* Prevent double borders */
                      cursor: pointer;
                      height: 25px;
                    }

                    form.example button:hover {
                      background: #0b7dda;
                    }

                    /* Clear floats */
                    form.example::after {
                        content: "";
                        clear: both;
                        display: table;
                    }

                    .table-contents {
                        margin-right: 5px;
                        margin-left: 5px;
                        font-family: 'Noto Sans', sans-serif;
                        font-size: 13px;
                    }

                    .table-headers {
                        margin-left: 5px;
                        margin-right: 5px;
                        border-bottom: solid white 1px;
                        font-family: 'Noto Sans', sans-serif;
                        font-size: 14px;
                    }

                    .hidden {
                        display: none;
                    }

                    .table-button {
                        font-family: 'Noto Sans', sans-serif;
                        font-size: 13px;
                        color: gray;
                        background-color: #2c2c2c;
                        border: solid dimgray 1px;
                        float: left;
                        cursor: pointer;
                        border-radius: 5px;
                    }

                    td, th {
                        white-space: nowrap;
                    }

                    table {
                        float: left;
                    }

                    tr {
                        line-height: 30px;
                    }

                    tr:nth-child(odd) {
                        background-color: #202020;
                    }

                    tr:nth-child(even) {
                        background-color: #2c2c2c;
                    }
                </style>
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
                    <button class="table-button" onClick="toggleTable2()">Added emotes</button>
                    <button style="margin-left: 5px;" class="table-button" onClick="toggleTable()">Removed emotes</button>
                    <br><br>
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
                    function toggleTable() {
                        document.getElementById("removed-emotes-table").classList.toggle("hidden");
                    }

                    function toggleTable2() {
                        document.getElementById("added-emotes-table").classList.toggle("hidden");
                    }
                </script>
            </body>
        </html>
        `
    );


});

// kunszg.xyz/api/channels
const apiDataChannels = () => {
	app.get("/channels", (req, res, next) => {
	 	res.send({
	 		data: channelOptions
        });
	});
}
apiDataChannels();
setInterval(()=>{apiDataChannels()}, 600000)

// kunszg.xyz/api/colors
const apiDataColors = (data) => {
	app.get("/colors", (req, res, next) => {
	 	res.json(
	 		data
		);
	});
}

const diagramData = async() => {
	const dataInsert = async(data) => {
		const info = await doQuery(`SELECT count(*) As data FROM user_list WHERE color="${data}"`);
		return info[0].data
	}
	const getData = await Promise.all([
		{"color": 'Red', 'amount': await dataInsert('#FF0000')},
		{"color": 'SpringGreen', 'amount': await dataInsert('#00FF7F')},
	 	{"color": 'DodgerBlue', 'amount': await dataInsert('#1E90FF')},
	 	{"color": 'BlueViolet', 'amount': await dataInsert('#8A2BE2')},
	 	{"color": 'OrangeRed', 'amount': await dataInsert('#FF4500')},
		{"color": 'GoldenRod', 'amount': await dataInsert('#DAA520')},
		{"color": 'Blue', 'amount': await dataInsert('#0000FF')},
		{"color": 'HotPink', 'amount': await dataInsert('#FF69B4')},
		{"color": 'Green', 'amount': await dataInsert('#008000')},
		{"color": 'YellowGreen', 'amount': await dataInsert('#9ACD32')},
		{"color": 'FireBrick', 'amount': await dataInsert('#B22222')},
		{"color": 'White', 'amount': await dataInsert('#FFFFFF')},
		{"color": 'SeaGreen', 'amount':await  dataInsert('#2E8B57')},
		{"color": 'Yellow', 'amount': await dataInsert('#FFFF00')},
		{"color": 'CadetBlue', 'amount': await dataInsert('#5F9EA0')},
		{"color": 'Coral', 'amount': await dataInsert('#FF7F50')},
		{"color": 'Chocolate', 'amount': await dataInsert('#D2691E')},
		{"color": 'Black', 'amount': await dataInsert('#000000')},
	])
	const cache = [];
	const check = await getData.forEach(i => cache.push(i.amount))
	const reduce = cache.reduce((a, b) => a + b, 0)
	return {'users': reduce, 'data': await getData.sort()}
}
diagramData().then((data) => {apiDataColors(data)})

const updateMem = async() => {
	await doQuery(`
		UPDATE memory SET memory="${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}" WHERE module="api"
		`)
}
updateMem()
setInterval(() => {
	updateMem()
}, 602000)

const shell = require('child_process');
// restart process every 4h
setInterval(()=>{shell.execSync('pm2 restart api')}, 7200000)
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
setInterval(()=>{statusCheck()}, 30000);