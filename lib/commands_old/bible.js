#!/usr/bin/env node
'use strict';

const got = require('got');
const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb bible',
  invocation: async (channel, user, message) => {
    try {
      const api = await utils.Get.api().url(message);
      const randomBibleVerse = await got(api).json();

      if (`${randomBibleVerse[0].chapter}:${randomBibleVerse[0].verse}` === '18:22') {
        return `${user['username']}, chapter 18:22 is kinda TOS monkaS`;
      }

      return (
        user['username'] +
        ', ' +
        randomBibleVerse[0].bookname +
        ': ' +
        randomBibleVerse[0].text +
        ' ' +
        randomBibleVerse[0].chapter +
        ':' +
        randomBibleVerse[0].verse
      );
    } catch (err) {
      utils.errorLog(err);
      return `${user['username']}, ${err} FeelsDankMan !!!`;
    }
  },
};
