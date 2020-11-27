#!/usr/bin/env node
'use strict';

const custom = require('../utils/functions.js');
const got = require('got');

module.exports = {
    name: 'kb token',
    invocation: async (channel, user, message, platform) => {
        try {
            const token = await got('https://wowtokenprices.com/current_prices.json').json();

            console.log(token.us)

            const howLongAgoEU = Date.now()/1000 - token.eu.time_of_last_change_unix_epoch;
            const howLongAgoNA = Date.now()/1000 - token.us.time_of_last_change_unix_epoch;

            return `Current WoW token prices by region:
            EU ${token.eu.current_price} gold ~ change by ${token.eu.last_change} (updated ${custom.secondsToDhms(howLongAgoEU)} ago),
            NA ${token.us.current_price} gold ~ change by ${token.us.last_change} (updated ${custom.secondsToDhms(howLongAgoNA)} ago)`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}