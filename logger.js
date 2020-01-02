
const fs = require('fs');
const api = require('./config.js');
const channelOptions = fs.readFileSync('./db/channels.js').toString().split('"').filter(
	function(i){return i != null;}).join('').split(' ')
const options = {
	options: {
		debug: true,
	},
	connection: {
		cluster: 'aws',
	},
	identity: {
		username: 'kunszgbot',
		password: api.oauth,
	},
	channels: channelOptions,
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const ignoreList = [
	'268612479',
	'68136884',
	'229225576',
	'100135110',
	'122770725',
	'442600612',
	'465732747',
	'469718952',
	'64313471',
	'425363834',
	'97661864',
	'413480192'
];

kb.connect();
kb.on('connected', (adress, port) => {
	const mysql = require('mysql2');
	const con = mysql.createConnection({
		host: "localhost",
		user: api.db_user,
		password: api.db_pass,
		database: "kbot",
	});
	con.connect(function(err) {
	  	if (err) {
	  		kb.say('supinic', '@kunszg, database connection error monkaS')
	  		console.log(err)
		} else {
	  		console.log("Connected!");
	  	}
	});
	kb.on('message', function (channel, user, message) {
		const filterBots = ignoreList.filter(i => i === user['user-id'])
		const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '')
		console.log(filterBots)
		if (channel === '#nymn') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else { 
				con.query('INSERT INTO logs_nymn (username, message, date) ' +  
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) ' + 
							'VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#haxk') {
			if (filterBots.length != 0  || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_haxk (username, message, date) ' + 
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) ' + 
							'VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#supinic') {
			if (filterBots.length != 0  || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_supinic (username, message, date) ' +  
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) ' + 
							'VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else {
			return;
		}
	})
})