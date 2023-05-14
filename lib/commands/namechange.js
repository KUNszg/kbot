#!/usr/bin/env node
'use strict';

const utils = require('../utils/utils.js');

module.exports = {
  name: 'kb namechange',
  invocation: async (channel, user, message) => {
    try {
      const msg = utils.getParam(message);

      const username = !msg[0] ? user.username : msg[0].replace(/@|,/g, '');

      let _user = await utils.Get.user().byUsername(username.toLowerCase());

      if (!_user.length) {
        return `${user.username}, username was not found.`;
      }

      _user = await utils.Get.user().byId(_user[0].userId);

      const getOptedOut = await utils.Get.user().optout(
        'namechange',
        _user[0].userId,
        'userId'
      );

      if (getOptedOut.length && user['user-id'] != _user[0].userId) {
        return `${user.username}, that user has opted out from being a target of this command.`;
      }

      if (_user.length < 2) {
        return `${user.username}, no name changes were found. (logs since April 2020)`;
      }

      let usernames = _user.map(i => i.username).join(' => ');

      if (usernames.length > 445) {
        usernames = usernames.split('').slice(0, 440).join('') + '...';
      }

      return `${user.username}, name changes detected (${_user.length - 1}): ${usernames}`;
    } catch (err) {
      utils.errorLog(err);
      return '';
    }
  },
};
