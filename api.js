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
const channelOptions = []
async function res() {
	channelList.push(await getChannels());
	await channelList[0].forEach(i => channelOptions.push(i.channel))
}
res()

function sleepGlob(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleepGlob(1000)

function apiData(data) {
	app.get("/channels", (req, res, next) => {
	 	res.json(
	 		data
		);
	});
}

apiData({data: channelOptions})

app.listen(3000, '95.217.65.143' () => {
 	console.log("Express running on port 3000");
});