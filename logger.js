const fs = require('fs');
const api = require('./config.js');
const channelOptions = fs.readFileSync('./db/channels.js').toString().split('"').filter(
	function(i) {
		return i != null;
	}).join('').split(' ')
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
	channels: ['nymn', 'haxk', 'supinic', 'pajlada', 'forsen', 'xqcow'],
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const ignoreList = [
	'268612479', // titlechange_bot 
	'68136884', // Supibot 
	'229225576', // kunszgbot
	'100135110', // StreamElements 
	'122770725', // Scriptorex 
	'442600612', // Mm_sUtilityBot 
	'465732747', // charlestonbieber 
	'469718952', // wayt00dank 
	'64313471', // HuwoBot 
	'425363834', // ThePositiveBot 
	'97661864', // botnextdoor
	'413480192', // futuregadget8 
	'132134724', // gazatu2
	'62541963', //snusbot
	'82008718', //pajbot
	'27574018', //magicbot321
	'264879410', //schnozebot
	'237719657' //fossabot
];

kb.connect();
kb.on('connected', (adress, port) => {
	const mysql = require('mysql2');
	const con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: "",
		database: "kbot",
	});
	con.connect(function(err) {
		if (err) {
			kb.say('kunszg', '@kunszg, database connection error monkaS')
			console.log(err)
		} else {
			console.log("Connected!");
		}
	});
	kb.on('message', function(channel, user, message) {
		const filterBots = ignoreList.filter(i => i === user['user-id'])
		const msg = message.replace(/[\u{E0000}|\u{206d}]/gu, '').replace(/"/g, '').replace(/'/g, '')
		if (channel === '#nymn') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_nymn (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#haxk') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_haxk (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#supinic') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_supinic (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#pajlada') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_pajlada (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#forsen') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_forsen (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#xqcow') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				con.query('INSERT INTO logs_xqcow (username, message, date) ' +
					'VALUES ("' + user['username'] + '", "' + msg + '", CURRENT_TIMESTAMP)',
					function(error, results, fields) {
						if (error) {
							console.log(error);
							con.query('INSERT INTO error_logs (error_message, date) ' +
								'VALUES ("' + error + '", CURRENT_TIMESTAMP)',
								function(error, results, fields) {
									if (error) {
										console.log(error);
										throw error;
									}
								})
						}
					})
			}
		} else if (channel === '#kunszg') {
			if (filterBots.length != 0 || msg === '') {
				return;
			} else {
				const sql = "INSERT INTO ?? (??, ??, ??) VALUES (??, ??, ??)";
				const inserts = ['logs_kunszg', 'username', 'message', 'date', user['username'], msg, 'CURRENT_TIMESTAMP'];
				con.query(mysql.format(sql, inserts), function(error, results, fields) {
					if (error) {
						console.log(error);
						const errorLog = "INSERT INTO ?? (??, ??) VALUES (??, ??)";
						const insertsLog = ['error_logs', 'error_message', 'date', error, 'CURRENT_TIMESTAMP'];
						errorLog = mysql.format(errorLog, insertsLog);
						con.query(sqlError, function(error, results, fields) {
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