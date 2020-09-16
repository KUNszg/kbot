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
    con.query(query, (err, results, fields) => {
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
    const headers = {
        "ID": " <div class='table-headers'>ID</div> ",
        "emote": " <div class='table-headers'>emote</div> ",
        "type": " <div class='table-headers'>type</div> ",
        "added": " <div class='table-headers'>added</div> "
    };
    if (typeof await req.query != "undefined") {
        const emotes = await doQuery(`
            SELECT *
            FROM emotes
            WHERE channel="${(typeof req.query.search === "undefined") ? req.query.search : req.query.search.toLowerCase()}"
            ORDER BY date
            DESC
            `);

        if (!emotes.length) {
            tableData.push({
                "ID": `<div class="table-contents" style="text-align: center;">-</div>`,
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
                    "emote": `<div class="table-contents" style="text-align: center;">${emotes[i].emote}</div>`,
                    "type": `<div class="table-contents" style="text-align: center;">${emotes[i].type}</div>`,
                    "added": `<div class="table-contents" style="text-align: center;">${(Date.parse(emotes[i].date) < 1594764720000) ? "*" : formatDate(emotes[i].date)}</div>`
                    // direct emote picture link
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
                        text-transform: lowercas;
                        content: "";
                        clear: both;
                        display: table;
                    }

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
                </style>
            </head>
            <body style="background-color: #1a1a1a">
                <br><br><br><br><br><br>
                <form class="example" action="emotes">
                    <input type="text" placeholder="Search for channel.." name="search">
                    <button type="submit"></button>
                </form>
                <br>
                <strong style="color: lightgray;">* - emote added before my logs</strong>
                <br><br>
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