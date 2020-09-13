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

(async () => {
    const commands = await doQuery(`
        SELECT *
        FROM commands
        `);

    const tableData = [];
    for (let i=0; i<commands.length; i++) {
        tableData.push({
                "ID": `${i+1} 󠀀 󠀀 `,
                "command": `<div style="text-align: center;">${commands[i].command} 󠀀 󠀀 </div>`,
                "cooldown": `<div style="text-align: center;">${commands[i].cooldown/1000}s 󠀀 󠀀 </div>`,
                "opt-outable": `<div style="text-align: center;">${(commands[i].optoutable === "Y") ? "yes" : "no"}  󠀀 󠀀 </div>`,
                "description": `${commands[i].description}`
            })
    }

    const headers = {"ID": "ID 󠀀 󠀀 ", "command": "command 󠀀 󠀀 ", "cooldown": "cooldown 󠀀 󠀀  ", "opt-outable": "opt-outable 󠀀 󠀀 ", "description": "description"};

    const Table = require('table-builder');

        app.get("/commands", (req, res, next) => {
           res.send(
               `<!doctype html>
              	<html>
              		<head>
    	          		<title>commands</title>
    					<meta name="viewport" content="width=device-width, initial-scale=1">
    					<link rel="icon" type="image/png" href="/home/kunszg/kbot/website/img/3x.gif"/>
                        <style>
                            tr {
                                line-height: 30px;
                            }
                            tr:nth-child(even) {background-color: #2c2c2c;}
                        </style>
              		</head>
              		<body style="background-color: #1a1a1a">
                        <div style="color: lightgray;">
        	          		${(new Table({'class': 'yepcock'}))
        					    .setHeaders(headers)
        					    .setData(tableData)
        					    .render()}
                        </div>
    				</body>
    			</html>
    		    `
            );
        });
})();

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