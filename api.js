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
con.on('error', function(err) {console.log(err)});
con.connect(function(err) {
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
				function(error, results, fields) {
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

const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results, fields) => {
        if (err) {
        	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
			const insert = [JSON.stringify(err), new Date()];
			con.query(mysql.format(sql, insert),
				function(error, results, fields) {
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

function sleep(milliseconds) {
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
    channels: ['supinic', 'xqcow', 'forsen', 'nymn', 'haxk'],
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
kb.connect();

async function res() {
	channelList.push(await getChannels());
	await channelList[0].forEach(i => channelOptions.push(i.channel))
}
res();
// setInterval(()=>{channelList.length = 0; channelOptions.length = 0; res();}, 3600000)

function sleepGlob(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleepGlob(1000)

const msgCount = [];
kb.on('chat', function(channel, message) {
    msgCount.push({'channel':channel.replace('#', ''), 'message':'add'})
})

// kunszg.xyz/api/messages
function apiDataMessages() {
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
function apiDataChannels() {
	app.get("/channels", (req, res, next) => {
	 	res.send({
	 		data: channelOptions
        });
	});
}
apiDataChannels();
setInterval(()=>{apiDataChannels()}, 600000)

// kunszg.xyz/api/colors
function apiDataColors(data) {
	app.get("/colors", (req, res, next) => {
	 	res.json(
	 		data
		);
	});
}

async function diagramData() {
	async function dataInsert(data) {
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
		{"color": 'Black', 'amount': await dataInsert('#000000')}
	])
	const cache = [];
	const check = await getData.forEach(i=>cache.push(i.amount))
	const reduce = cache.reduce((a, b) => a + b, 0)
	return {'users': reduce, 'data': await getData.sort()}
}
diagramData().then(function(data) {setInterval(()=>{apiDataColors(data)}, 10000)})

async function kden() {
	await doQuery(`
		UPDATE memory SET memory="${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}" WHERE module="api"
		`)
}
kden()
setInterval(() => {
	kden()
}, 602000)

const shell = require('child_process');
// restart process every 4h
setInterval(()=>{shell.execSync('pm2 restart api')}, 7200000)
const server = app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
    const port = server.address().port;
    console.log('app running on port', port);
});

async function statusCheck() {
		await doQuery(`
			UPDATE stats
			SET date="${new Date().toISOString().slice(0, 19).replace('T', ' ')}"
			WHERE type="module" AND sha="api"
			`)
	}
statusCheck();
setInterval(()=>{statusCheck()}, 30000);