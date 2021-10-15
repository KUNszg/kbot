#!/usr/bin/env node
'use strict';

// first connection to database to receive channel list
const creds = require('./config.js');
const mysql = require('mysql2');
const con = mysql.createConnection({
	host: creds.db_host,
	user: creds.db_server_user,
	password: creds.db_pass,
	database: creds.db_name
});

con.on('error', (err) => {
    if (err.fatal) {
        con.destroy();
    }
    throw err;
});

const getChannels = () => new Promise((resolve, reject) => {
    con.query('SELECT * FROM channels', (err, results) => {
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

let options = {
	options: {
		debug: false,
	},
	connection: {
		secure: true
	},
	identity: {
		username: 'ksyncbot',
		password: creds.oauth,
	},
	channels: channelOptions,
};

if (process.platform === "win32") {
    options = {
        options: {
            debug: false,
        },
        connection: {
            secure: true
        },
        identity: {
            username: 'ksyncbot',
            password: creds.oauth,
        },
        channels: ["ksyncbot"],
    };
}

module.exports = { options, con }

channelList.length = 0
channelOptions.length = 0
