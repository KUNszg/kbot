
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

kb.connect();
kb.on('connected', (adress, port) => {
	const mysql = require('mysql');
	const con = mysql.createConnection({
		host: "localhost",
		user: api.db_user,
		password: api.db_pass,
		database: "kbot"
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
		if (channel === '#nymn') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else { 
				con.query('INSERT INTO logs_nymn (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '').replace(/!/g, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#haxk') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else {
				con.query('INSERT INTO logs_haxk (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '').replace(/!/g, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
							if (error) {
								console.log(error);
								throw error;
							}
						})
					}
				})
			}
		} else if (channel === '#supinic') {
			if (user['user-id'] === '229225576' || message === '') {
				return;
			} else {
				con.query('INSERT INTO logs_supinic (username, message, date) VALUES ("' + user['username'] + '", "' + message.replace(/[\u{E0000}|\u{206d}]/gu, '').replace(/!/g, '') + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
					if (error) {
						console.log(error);
						con.query('INSERT INTO error_logs (error_message, date) VALUES ("' + error + '", CURRENT_TIMESTAMP)', function (error, results, fields) {
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