#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');
const creds = require('../credentials/config.js');
const regex = require('../utils/regex.js');

const got = require('got');

module.exports = {
  name: 'kb locate',
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message);

      const flag = msg.find(i => i === '-dist');

      // kb locate -dist param1 to param2
      if (flag) {
        const findMessage = msg.filter(i => i != '-dist');
        if (!findMessage.length) {
          return `${user['username']}, please provide a message with that flag :)`;
        }

        if (!findMessage.join(' ').includes('to')) {
          return `${user['username']}, wrong syntax, use the command
                    like: kb locate -dist helsinki to munich`;
        }

        const getParams = msg.splice(1).join(' ').split('to');

        let param1 = getParams[0].split(' ').slice(0, -1).join(' ');
        let param2 = getParams[1].split(' ').splice(1).join(' ');

        const distance = await got(
          encodeURI(`https://www.distance24.org/route.json?stops=${param1}|${param2}`)
        ).json();

        if (distance.stops[0].city === distance.stops[1].city) {
          return `${user['username']}, please provide different locations to search for :)`;
        }

        if (distance.stops[0].type === 'Invalid' && distance.stops[1].type === 'Invalid') {
          return `${user['username']}, both provided locations were not found`;
        }

        if (distance.stops[0].type === 'Invalid') {
          return `${user['username']}, location "${getParams[0]}" was not found.`;
        }

        if (distance.stops[1].type === 'Invalid') {
          return `${user['username']}, location "${getParams[1]}" was not found`;
        }

        if (!Number(distance.distance)) {
          return `${user['username']}, Provided locations are closer than 1km to eachother.`;
        }

        param1 = distance.stops[0].city;
        param2 = distance.stops[1].city;

        let miles = Math.trunc(distance.distance * 0.6214);

        return `${user['username']}, distance between ${param1} and ${param2} is
                ${distance.distance}km (${miles}mi)`.replace(/ń/g, 'n');
      }

      if (!msg[0]) {
        return `${user['username']}, please provide an IP or location to search :)`;
      }

      if (msg.find(i => i.match(regex.localhost))) {
        return `${user['username']}, that's a loopback IP FeelsDankMan`;
      }
      if (msg.join(' ').includes('192.168.0.1')) {
        return `Please log in to your router: username [______] password [______] [submit]`;
      }

      // kb locate [ip/location]

      const net = require('net');

      if (net.isIP(msg[0]) != 0) {
        const locate = await got(
          `http://api.ipstack.com/${encodeURI(msg.join(' '))}?access_key=${creds.locate}`
        ).json();

        if (locate.type) {
          return `${user['username']}, location for ${msg} => type: ${locate.type}, country:
						${locate.country_name}, region: ${locate.region_name}, city: ${locate.city} monkaS`;
        }
      }

      if (!utils.hasNumber(msg[0])) {
        const locationNames = await got(
          `http://api.geonames.org/searchJSON?q=${encodeURI(
            msg.join(' ')
          )}&maxRows=1&username=kunszg`
        ).json();

        const location = locationNames.geonames[0];

        if (!location) {
          return `${user['username']}, could not find given location or location does not exist.`;
        }

        const country = location.countryName;
        const region = !location.adminName1.length ? ' ' : `, ${location.adminName1}`;
        const city = location.name === location.countryName ? ' ' : `, ${location.name}`;
        const population = !Number(location.population)
          ? ''
          : ` population: ${location.population} | `;
        const info =
          !Number(location.population) && location.fcodeName === 'populated place'
            ? 'no further data'
            : location.fcodeName;

        return `${user['username']}, results: ${locationNames.totalResultsCount} |
                location: ${country}${region}${city} | ${population} | info: ${info}`.replace(
          /ń/g,
          'n'
        );
      }

      return `${user['username']}, provided IP is invalid. :/`;
    } catch (err) {
      if (err.message.includes('read property')) {
        utils.errorLog(err.message);
        return `${user['username']}, location not found.`;
      }

      utils.errorLog(err);
      return `${user['username']}, error FeelsDankMan !!!`;
    }
  },
};
