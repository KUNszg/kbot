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
	database.query(mysql.format(query), (err, results, fields) => {
		if (err) {
			console.log(err)
			return;
		} else {
			resolve(results);
		}
	});
});

// check for banphrases with Pajbot API
exports.banphrasePass = (output, channel) => new Promise((resolve, reject) => {
    const channelParsed = channel.replace('#', '');
	if (channelParsed === "forsen") {
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
	} else if (channelParsed === "nymn" || channelParsed === "pajlada") {
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
	} else if (channelParsed === "vadikus007") {
        const banphrasePass = (
            fetch('https://vadikus007.botfactory.live/api/v1/banphrases/test', {
                method: "POST",
                url: "https://vadikus007.botfactory.live/api/v1/banphrases/test",
                body: "message=" + output,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
        }).then(response => response.json()));
        resolve(banphrasePass);
    }
    resolve({banned: output});
});

// check for user permissions with database
exports.checkPermissions = async (username) => {
	const checkPermissionList = await doQueryIn(`
		SELECT *
		FROM trusted_users
		WHERE username="${username}"
		`);
	if (checkPermissionList.length === 0 || checkPermissionList[0].status === "inactive") {
		return 0;
	}
	return checkPermissionList[0].permissions.split(':')[0];
}

// insert error to database if one occurs
exports.errorLog = async(err) => {
	console.log(err)
	const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
	const insert = [JSON.stringify(err), new Date()];
	await doQueryIn(mysql.format(sql, insert));
}

exports.format = (seconds) => {
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
		} else {
			return hours + 'h ' + minutes + 'm ' + seconds + "s";
		}
	}
}

// get rid of this in future
exports.capitalizeFirstLetter = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// check if string contains number, replace this in future
exports.hasNumber = (myString) => {
	return /\d/.test(myString);
}

// get unicode code of given character
exports.escapeUnicode = (str) => {
	return str.replace(/[^\0-~]/g, function(ch) {
		return "\\u{" + ("000" + ch.charCodeAt().toString(16)).slice(-4) + '}';
	});
}

// get rid of this in future
exports.lCase = (string) => {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

// replace invisible character in message and get parameters from the message
exports.getParam = (message, splice) => {
    if (splice) {
        return message
            .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
            .split(' ')
            .splice(splice)
            .filter(Boolean);
    }
    return message
        .replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
        .split(' ')
        .splice(2)
        .filter(Boolean);
}

exports.strictChannels = (channel) => {
    const channels = [
        '#nymn',
        '#forsen',
        '#vadikus007'
    ];
    const currentChannel = channels.filter(i => i === channel);
    if (currentChannel.length === 0) {
        return false
    }
    return true
}

exports.random = (arr) => {
	return arr[Math.floor(Math.random() * arr.length)];
}

exports.secondsToDhms = (seconds) => {
	seconds = Number(seconds);
	const d = Math.floor(seconds / (3600*24));
	const h = Math.floor(seconds % (3600*24) / 3600);
	const m = Math.floor(seconds % 3600 / 60);
	const s = Math.floor(seconds % 60);

	const dDisplay = d > 0 ? d + "d " : "";
	const hDisplay = h > 0 ? h + "h " : "";
	const mDisplay = m > 0 ? m + "m " : "";
	const sDisplay = s > 0 ? s + "s " : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.secondsToDhm = (seconds) => {
	seconds = Number(seconds);
	const d = Math.floor(seconds / (3600*24));
	const h = Math.floor(seconds % (3600*24) / 3600);
	const m = Math.floor(seconds % 3600 / 60);

	const dDisplay = d > 0 ? d + "d " : "";
	const hDisplay = h > 0 ? h + "h " : "";
	const mDisplay = m > 0 ? m + "m " : "";
	return dDisplay + hDisplay + mDisplay;
}

exports.secondsToDh = (seconds) => {
	seconds = Number(seconds);
	const d = Math.floor(seconds / (3600*24));
	const h = Math.floor(seconds % (3600*24) / 3600);

	const dDisplay = d > 0 ? d + "d " : "";
	const hDisplay = h > 0 ? h + "h " : "";
	return dDisplay + hDisplay;
}