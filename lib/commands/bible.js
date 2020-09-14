#!/usr/bin/env node
'use strict';

const got = require('got');
const custom = require('../utils/functions.js');

module.exports = {
    name: "kb joemama",
    invocation: async (channel, user, message, args) => {
        try {
            const randomBibleVerse = await got('https://labs.bible.org/api/?passage=random&type=json').json();

            if (`${randomBibleVerse[0].chapter}:${randomBibleVerse[0].verse}` === '18:22') {
                return `${user['username']}, chapter 18:22 is kinda TOS monkaS`;
            }

            return `${user['username']}, ${randomBibleVerse[0].bookname}: ${randomBibleVerse[0].text} ${randomBibleVerse[0].chapter}:${randomBibleVerse[0].verse}`;
        } catch (err) {
            custom.errorLog(err)
            return `${user['username']}, ${err} FeelsDankMan !!!`;
        }
    }
}