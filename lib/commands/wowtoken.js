#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const kb = require('../handler.js').kb;
const got = require('got');

module.exports = {
    name: 'kb token',
    invocation: async (channel, user, message, platform) => {
        try {
            if (channel != "#haxk") {
                return `${user['username']}, this command is not usable in this channel`;
            }

            kb.say(channel, 'ppHop');

            const token = await got('https://wowtokenprices.com/current_prices.json').json();

            const howLongAgoEU = Date.now()/1000 - token.eu.time_of_last_change_unix_epoch;
            const howLongAgoNA = Date.now()/1000 - token.us.time_of_last_change_unix_epoch;

            return `Current WoW token prices by region:
            EU ${token.eu.current_price}g (change by ${token.eu.last_change}g, updated ${custom.secondsToDhms(howLongAgoEU)} ago),
            NA ${token.us.current_price}g (change by ${token.us.last_change}g, updated ${custom.secondsToDhms(howLongAgoNA)} ago)`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}