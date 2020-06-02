#!/usr/bin/env node
'use strict';

const mysql = require('mysql2');
const database = require('../credentials/login.js').con
const fetch = require('node-fetch');

const doQueryIn = (query) => new Promise((resolve, reject) => {
    database.query(query, (err, results, fields) => {
        if (err) {
            reject(err);
        } else {
            resolve(results);
        }
    });
});

exports.doQuery = (query) => new Promise((resolve, reject) => {
	database.query(query, (err, results, fields) => {
		if (err) {
			return;
		} else {
			resolve(results);
		}
	});
});

// check for banphrases with Pajbot API
exports.banphrasePass = (output, channel) => new Promise((resolve, reject) => {
	if (channel === "forsen") {
		const banphrasePass = (
			fetch('https://forsen.tv/api/v1/banphrases/test', {
				method: "POST",
				url: "https://forsen.tv/api/v1/banphrases/test",
				body: "message=" + output,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
			}).then(response => response.json()));
		resolve(banphrasePass);
	} else {
		// other channels
		const banphrasePass = (
			fetch('https://nymn.pajbot.com/api/v1/banphrases/test', {
				method: "POST",
				url: "https://nymn.pajbot.com/api/v1/banphrases/test",
				body: "message=" + output,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
			}).then(response => response.json()));
		resolve(banphrasePass);
	}
});

exports.checkPermissions = async (username) => {
	const checkPermissionList = await doQueryIn(`
		SELECT *
		FROM trusted_users
		WHERE username="${username}"
		`);
	if (checkPermissionList.length === 0 || checkPermissionList[0].status === "inactive") {
		return 0;
	}
    if (checkPermissionList[0].permissions === 'terraria') {
        return 'terraria'
    }
	return checkPermissionList[0].permissions.split(':')[0];
}

exports.errorLog = async(err) => {
	console.log(err)
	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
	const insert = [JSON.stringify(err), new Date()];
	await doQueryIn(mysql.format(sql, insert));
}

exports.formatPing = (seconds) => {
	function pad(s) {
		return (s < 10 ? '0' : '') + s;
	}
	var hours = Math.floor(seconds / (60 * 60));
	var minutes = Math.floor(seconds % (60 * 60) / 60);
	var seconds = Math.floor(seconds % 60);
	if (hours === 0 && minutes != 0) {
		return minutes + 'm ' + seconds + "s";
	} else {
		if (minutes === 0 && hours === 0) {
			return seconds + "s"
		} else if (seconds === 5 || hours === 0 && minutes === 0) {
			return '0s'
		} else {
			return hours + 'h ' + minutes + 'm ' + seconds + "s";
		}
	}
}

exports.formatUptime = (seconds) => {
	function pad(s) {
		return (s < 10 ? '0' : '') + s;
	}
	var hours = Math.floor(seconds / (60 * 60));
	var minutes = Math.floor(seconds % (60 * 60) / 60);
	var seconds = Math.floor(seconds % 60);
	if (hours === 0 && minutes != 0) {
		return minutes + 'm ' + seconds + "s";
	} else {
		if (minutes === 0 && hours === 0) {
			return seconds + "s"
		} else if (seconds === 5 || hours === 0 && minutes === 0) {
			return 'few seconds'
		} else {
			return hours + 'h ' + minutes + 'm ' + seconds + "s";
		}
	}
}


exports.formatGithub = (seconds) => {
	function pad(s) {
		return (s < 10 ? '0' : '') + s;
	}
	var hours = Math.floor(seconds / (60 * 60));
	var minutes = Math.floor(seconds % (60 * 60) / 60);
	var seconds = Math.floor(seconds % 60);
	if (hours === 0 && minutes != 0) {
		return minutes + 'm ' + seconds + "s";
	} else {
		if (minutes === 0 && hours === 0) {
			return seconds + "s"
		} else if (seconds === 0 || hours === 0 && minutes === 0) {
			return 'just now!'
		} else {
			return hours + 'h ' + minutes + 'm ' + seconds + "s";
		}
	}
}

exports.capitalizeFirstLetter = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.hasNumber = (myString) => {
	return /\d/.test(myString);
}

exports.escapeUnicode = (str) => {
	return str.replace(/[^\0-~]/g, function(ch) {
		return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
	});
}

exports.lCase = (string) => {
	return string.charAt(0).toLowerCase() + string.slice(1);
}