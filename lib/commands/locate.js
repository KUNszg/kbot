#!/usr/bin/env node
'use strict';

const prefix = "kb ";
const custom = require('../utils/functions.js');
const creds = require('../credentials/config.js')
const got = require('got');

module.exports = {
	name: prefix + "locate",
	aliases: prefix + "location",
	description: `kb locate [-distance] [IP/message] | IP - provide an IP adress to search for its location |
	message - provide a non-numeric message to search for its location | -dist - measure a distance between two locations`,
	permission: 0,
	cooldown: 6000,
	invocation: async (channel, user, message, args) => {
		try {
			const msg = custom.getParam(message);

			const findFlag = msg.find(i => i === '-dist');

			if (typeof findFlag != 'undefined' || msg[1] === 'distance') {
				const findMessage = msg.filter(i => i != '-dist');
				if (findMessage.length === 0) {
					return `${user['username']}, please provide a message :)`;
				}

				if (!(findMessage.join(' ').includes('to') || findMessage.join(' ').includes('|'))) {
					return `${user['username']}, wrong syntax, separate city/country names with "|" or "to" -> france | russia`;
				}

				const findparams = msg.splice(1).join(' ').split('to');
                kb.say(channel, JSON.stringify(findparams))
				const distance = await got(encodeURI(`https://www.distance24.org/route.json?stops=${findparams[0].split(' ').slice(0, -1).join(' ')}|${findparams[1].split(' ').splice(1).join(' ')}`)).json();

				if (distance.stops[0].city === distance.stops[1].city) {
					return `${user['username']}, please provide different locations to search for :)`;
				}

				if (distance.stops[0].type === "Invalid" && distance.stops[1].type === "Invalid") {
					return `${user['username']}, both provided locations were not found`;
				}

				if (distance.stops[0].type === "Invalid") {
					return `${user['username']}, location "${findparams[0]}" was not found.`;
				}

				if (distance.stops[1].type === "Invalid") {
					return `${user['username']}, location "${findparams[1]}" was not found`;
				}

				if (Number(distance.distance) === 0) {
					return `${user['username']}, Provided locations are closer than 1km to eachother.`;
				}

				const param1 = distance.stops[0].city.replace('ń', 'n'); // .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
				const param2 = distance.stops[1].city.replace('ń', 'n'); // .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

				return `${user['username']}, distance between ${param1} and ${param2} is ${distance.distance}km (${(distance.distance*0.6214).toFixed(2)}mi)`;
			}

			if (!msg[0]) {
				return `${user['username']}, please provide an IP or location to search :)`;
			}

			if (msg.join(' ').includes('127.0.0.1')) {
				return `${user['username']}, that's a loopback IP FeelsDankMan`
			}
			if (msg.join(' ').includes('192.168.0.1')) {
				return `${user['username']}, that's a private network IP FeelsDankMan`;
			}

			const net = require('net');
			if (net.isIP(msg.join(' ')) != 0) {
				const locate = await got(`http://api.ipstack.com/${encodeURI(msg.join(' '))}?access_key=${creds.locate}`).json()

				if (locate.type != null) {
					return `${user['username']}, location for ${msg} => type: ${locate.type}, country:
						${locate.country_name}, region: ${locate.region_name}, city: ${locate.city} monkaS`;
				}
			}

			if (!custom.hasNumber(msg[0])) {
				const locationNames = await got(`http://api.geonames.org/searchJSON?q=${encodeURI(msg.join(' '))}&maxRows=1&username=kunszg`).json()
				const location = locationNames.geonames[0];

				if (typeof location === 'undefined') {
					return `${user['username']}, could not find given location or location does not exist.`;
				}

				const country = location.countryName.replace("ń", "n");
				const region = location.adminName1.length === 0 ? ' ' : `, ${location.adminName1.replace("ń", "n")}`;
				const city = location.name === location.countryName ? ' ' : `, ${location.name.replace("ń", "n")}`;
				const population = (Number(location.population)) === 0 ? '' : ` population: ${location.population} | `
				const info = (Number(location.population) === 0 && location.fcodeName === "populated place") ?
				"no further data" : location.fcodeName;

				return `${user['username']},
					results: ${locationNames.totalResultsCount} |
					location: ${country}${region}${city} |
					${population}
					info: ${info}`;
			}

			return `${user['username']}, provided IP is invalid. :/`;
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