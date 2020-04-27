#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')

module.exports = {
	name: prefix + "locate",
	aliases: prefix + "location",
	description: `syntax: kb locate [IP/message] | IP - provide an IP adress to search for its location | 
	message - provide a non-numeric message to search for its location -- cooldown 6s`,
	permission: 0,
	cooldown: 6000,
	invocation: async (channel, user, message, args) => {
		try {

			const msg = message
				.replace(/[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu, '')
				.split(" ")
				.splice(2);

			const fetch = require('node-fetch');
			const locate = await fetch(`
				http://api.ipstack.com/${msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}?access_key=${creds.locate}`)
					.then(response => response.json());

			if (locate.type != null && custom.hasNumber(msg[0])) {
				return `${user['username']}, location for ${msg} => type: ${locate.type}, country:
					${locate.country_name}, region: ${locate.region_name}, city: ${locate.city} monkaS`;
			}

			if (!msg[0]) {
				return `${user['username']}, please provide an IP or location to search :)`;
			} 

			if (!custom.hasNumber(msg[0]) && msg[0].match(/^\w+$/)) {
				const location = await fetch(
					creds.geonames + msg.join(' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + 
					'&maxRows=1&username=kunszg')
						.then(response => response.json());

				if (typeof location.geonames[0] === 'undefined') {
					return `${user['username']}, could not find given location or location does not exist.`;
				}
				
				return `${user['username']}, results: ${location.totalResultsCount} | location:
					${location.geonames[0].countryName.replace("ń", "n")},
					${location.geonames[0].adminName1.replace("ń", "n")},
					${location.geonames[0].name.replace("ń", "n")} | population:
					${location.geonames[0].population}, info:
					${location.geonames[0].fcodeName}`;
			} 

			if (!msg[0].match(/^\w+$/) && !msg[0].includes('.')) {
				return `${user['username']}, special character detected HONEYDETECTED`;
			} 
			
			return `${user['username']}, could not find given location or location does not exist KKona`;
			
		} catch (err) {
			if (err.message.includes("read property")) {
				custom.errorLog(err.message)
				return `${user['username']}, location not found.`;
			}
			custom.errorLog(err)
			return `${user['username']}, ${err.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')} FeelsDankMan !!!`;
		}
	}
}