#!/usr/bin/env node

'use strict';

const api = require('./config.js');

// parse the channel list 
// check for empty items in an array

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
	channels: ['kunszg', 'kunszgbot'],
};

const tmi = require('tmi.js');
const kb = new tmi.client(options);
const repeatedMessages = {
	supinic: null
};

kb.connect();
kb.on('connected', (adress, port) => {

	kb.say('kunszg', 'reminders reconnected KKona')
	const fetch = require("node-fetch");
	const mysql = require('mysql2');
	const con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: "",
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

	async function errorLog(err) {
		console.log(err)
		const sql = 'INSERT INTO error_logs (error_message, date) VALUES (?, ?)';
		const insert = [JSON.stringify(err), new Date()];
		await doQuery(mysql.format(sql, insert));
	}

	// unfire clogging reminders
	async function unfireCookie() {
		
		// cookies
		const unfire = await doQuery('SELECT username, channel, fires, status FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');

		if (!unfire[0]) {
			return;
		} else {

			// some KKona shit going out there
			const serverDate = new Date();
			const fires = new Date(unfire[0].fires);
			const diff = serverDate - fires
			const differenceToSec = diff/1000;

			if (differenceToSec>15) {

				// update the database with fired reminder
				const selectUnfiredUsers = await doQuery('SELECT * FROM cookie_reminders WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
				if (!selectUnfiredUsers[0]) {
					return '';
				} else {
					const dateUnfiredUsers = new Date(selectUnfiredUsers[0].fires)
					const unfiredDiff = (serverDate - dateUnfiredUsers)/1000/60
					kb.say(selectUnfiredUsers[0].channel, selectUnfiredUsers[0].username + ', you had an unfired cookie reminder ' + unfiredDiff.toFixed(0) + ' minutes ago, sorry about that and eat your cookie please :)');
					await doQuery('UPDATE cookie_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
				}
			}
		}
	}
	setInterval(() => {
		unfireCookie()
	}, 10000)

	// unfire clogging reminders
	async function unfireEd() {

		// ed
		const unfire = await doQuery('SELECT username, channel, fires, status FROM ed_reminders WHERE status!="fired" ORDER BY fires ASC');
		if (!unfire[0]) {
			return;
		} else {
			const serverDate = new Date();
			const fires = new Date(unfire[0].fires);
			const diff = serverDate - fires
			const differenceToSec = diff/1000;

			if (differenceToSec>15) {

				// update the database with fired reminder
				const selectUnfiredUsers = await doQuery('SELECT * FROM ed_reminders WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
				if (!selectUnfiredUsers[0]) {
					return '';
				} else {
					const dateUnfiredUsers = new Date(selectUnfiredUsers[0].fires)
					const unfiredDiff = (serverDate - dateUnfiredUsers)/1000/60
					kb.whisper(selectUnfiredUsers[0].username, 'You had an unfired dungeon reminder ' + unfiredDiff.toFixed(0) + ' minutes ago, sorry about that and enter the dungeon please :)');
					await doQuery('UPDATE ed_reminders SET status="fired" WHERE fires < TIMESTAMPADD(SECOND, -8, NOW()) AND STATUS="scheduled" ORDER BY fires ASC LIMIT 1;');
				}
			}
		}
	}
	setInterval(() => {
		unfireEd()
	}, 10000)

	// check and send reminders - cookie
	async function reminder() {	
		const value = await doQuery('SELECT username, channel, fires, status FROM cookie_reminders WHERE status!="fired" ORDER BY fires ASC');
		
		// if there is no "fired" argument, ignore
		if (!value[0]) {
			return;
		} else {

			// some KKona shit going out there
			const serverDate = new Date();
			const fires = new Date(value[0].fires);
			const diff = serverDate - fires
			const differenceToSec = diff/1000;

			// consider only cases where reminder is apart from current date by 7 seconds
			if ((differenceToSec<=7) && !(differenceToSec<0)) {
				const limit = new Set();

				// make sure not to repeat the same reminder by adding a unique username
				// to the Set Object and delete it after 10s 
				if (limit.has(value[0].username)) {
					return;
				} else {
					limit.add(value[0].username)
					kb.say(value[0].channel, '(cookie reminder) ' + value[0].username + ', eat cookie please :) 🍪')
					setTimeout(() => {limit.delete(value[0].username)}, 10000)		
				}

				// update the database with fired reminder
				await doQuery('UPDATE cookie_reminders SET status="fired" WHERE username="' + 
					value[0].username + '" AND status="scheduled"');
			}
		}
	}

	setInterval(() => {
		reminder()
	}, 1000)

	async function reminder2() {
		const value = await doQuery('SELECT username, channel, fires, status FROM ed_reminders WHERE status!="fired" ORDER BY fires ASC');

		// if there is no "fired" argument, ignore
		if (!value[0]) {
			return;
		} else {

			// some KKona shit going out there
			const serverDate = new Date();
			const fires = new Date(value[0].fires);
			const diff = serverDate - fires
			const differenceToSec = diff/1000;

			// consider only cases where reminder is apart from current date by 7 seconds
			if ((differenceToSec<=7) && !(differenceToSec<0)) {
				const limit = new Set();

				// make sure not to repeat the same reminder by adding a unique username
				// to the Set Object and delete it after 10s 
				if (limit.has(value[0].username)) {
					return;
				} else {
					limit.add(value[0].username)
					kb.whisper(value[0].username, '(ed reminder) enter dungeon please :) 🏰 ')
					setTimeout(() => {limit.delete(value[0].username)}, 10000)		
				}

				// update the database with fired reminder
				await doQuery('UPDATE ed_reminders SET status="fired" WHERE username="' + 
					value[0].username + '" AND status="scheduled"');
			}
		}
	}
	setInterval(() => {
		reminder2()
	}, 1000)
})