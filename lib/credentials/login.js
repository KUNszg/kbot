#!/usr/bin/env node
'use strict';

// first connection to database to receive channel list 
// this should be moved into another module and reworked
const creds = require('./config.js');
const mysql = require('mysql2');
const con = mysql.createConnection({
	host: creds.db_host,
	user: creds.db_server_user,
	password: creds.db_pass,
	database: creds.db_name
});
const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results, fields) => {
        if (err) {
            reject(err);
        } else {
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

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}
sleep(1500)

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

module.exports = { options, con }