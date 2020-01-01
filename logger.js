
const kb = require('./bot.js').kb
const con = require('./bot.js').con
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