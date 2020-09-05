const express = require("express");
const app = express();
const api = require('./config.js');
const mysql = require('mysql2');

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
    con.query(query, (err, results, fields) => {
        if (err) {
        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
			const insert = [JSON.stringify(err), new Date()];
			con.query(mysql.format(sql, insert),
				(error, results, fields) => {
					if (error) {
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
})
/*
// test
const requireDir = require('require-dir');
const commands = requireDir('./lib/commands');
const commandNames = Object.keys(commands);

const tableData = [];
commandNames.map(i => tableData.push({'command': commands[i].name.replace('kb ', ''), 'cooldown': commands[i].cooldown/1000+'sec'}));

const headers = { "command": "command", "cooldown": "cooldown"};

const Table = require('table-builder');

const send = () => {
    app.get("/test", (req, res, next) => {
       res.send(
           `<!doctype html>
          	<html>
          		<head>
	          		<title>commands</title>
	          		<link rel="stylesheet" type="text/css" href="./style.css">
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<link rel="icon" type="image/png" href="./website/html/img/3x.gif"/>
          		</head>
          		<body class="bd">
	          		${(new Table({'class': 'command-table'}))
					    .setHeaders(headers)
					    .setData(tableData)
					    .render()}
				</body>
			</html>
		    `
        );
    });
}
send()*/

// kunszg.xyz/api/messages
const apiDataMessages = () => {
    app.get("/messages", (req, res, next) => {
       res.send({
            data: {
                'forsen': msgCount.filter(i=>i.channel==='forsen').length,
                'nymn': msgCount.filter(i=>i.channel==='nymn').length,
                'supinic': msgCount.filter(i=>i.channel==='supinic').length,
                'xqcow': msgCount.filter(i=>i.channel==='xqcow').length,
                'haxk': msgCount.filter(i=>i.channel==='haxk').length
            }
        });
    });
}
setInterval(()=>{
    apiDataMessages()
}, 500)
setInterval(()=>{
    msgCount.length = 0;
}, 1000)

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

const spotify = async() => {
    app.get("/spotify_resolved", async (req, res) => {
        if (typeof req.query.code === 'undefined') {
            res.redirect('/error')
        }

        const api = `https://accounts.spotify.com/api/token?grant_type=authorization_code&client_id=${creds.client_id_spotify}&client_secret=${creds.client_secret_spotify}&code=${req.query.code}&redirect_uri=https://kunszg.xyz/integration`
        const code = await fetch(api, {
            method: "POST",
            url: api,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).then(response => response.json());

        const tokenSpotify = await fetch(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${code.refresh_token}&client_secret=${creds.client_secret_spotify}&client_id=${creds.client_id_spotify}`, {
            method: "POST",
            url: `https://accounts.spotify.com/api/token`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).then(response => response.json())

        const checkPremium = await fetch("https://api.spotify.com/v1/me", {
            method: "GET",
            url: "https://api.spotify.com/v1/me",
            headers: {
                "Authorization": `Bearer ${tokenSpotify.access_token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
        }).then(response => response.json());

        res.redirect('/integration');
    })
}
spotify()

// kunszg.xyz/resolved
app.get("/resolved", async (req, res) => {
    const fetch = require('node-fetch')
    const creds = require('./lib/credentials/config.js');
    const custom = require('./lib/utils/functions.js');

    if (typeof req.query.code === 'undefined') {
        res.redirect('/error')
    }


    const refresh_token = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${creds.client_id}&client_secret=${creds.client_secret}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=https://kunszg.xyz/resolved`, {
        method: "POST",
        url: `https://id.twitch.tv/oauth2/token?client_id=${creds.client_id}&client_secret=${creds.client_secret}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=https://kunszg.xyz/resolved`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
    }).then(response => response.json());

    const userData = await fetch(`https://api.twitch.tv/helix/users?client_secret=${creds.client_secret}`, {
        method: "GET",
        url: "https://id.twitch.tv/oauth2/token",
        headers: {
            "Client-ID": creds.client_id,
            "Authorization": `Bearer ${refresh_token.access_token}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
    }).then(response => response.json())

    res.redirect('https://accounts.spotify.com/authorize?client_id=0a53ae5438f24d0da272a2e663c615c3&response_type=code&redirect_uri=https://kunszg.xyz/spotify_resolved&scope=user-modify-playback-state%20user-read-playback-position%20user-top-read%20user-read-playback-state%20user-read-recently-played%20user-read-currently-playing%20user-read-email%20user-read-private')

    await custom.doQuery(`
        INSERT INTO access_token (access_token, refresh_token, scopes, userName, platform, user, premium)
        VALUES ("${spotify().access_token}", "${spotify().refresh_token}", "${spotify().scope}", "${userData.data[0].login}", "spotify", "${userData.data[0].id}", "${(spotify().product === "open") ? "N" : "Y"}")
        `);
});


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