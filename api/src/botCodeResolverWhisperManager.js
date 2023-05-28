const utils = require('../../lib/utils/utils');
const _ = require('lodash');
const moment = require('moment');

const botCodeResolverWhisperManager = services => {
  const { kb } = services;

  kb.on('whisper', async (username, user, message, self) => {
    if (self) return;

    let owner = await utils.Get.user().owner();
    owner = _.get(_.first(owner), 'username');

    kb.whisper(owner, `whisper to kbot: ${username}: ${message}`);

    const codePrefix = _.first(_.split(message, ' '));
    const code = _.get(_.split(message, ' '), 1);

    const userId = _.get(user, 'user-id');

    if (codePrefix === 'verify-lastfm') {
      const checkBan = await kb.query(
        `
            SELECT *
            FROM ban_list
            WHERE user_id=?`,
        [userId]
      );

      if (!_.isEmpty(checkBan)) return;

      const checkCode = await kb.query(
        `
            SELECT *
            FROM access_token
            WHERE code=?`,
        [code]
      );

      if (_.isEmpty(checkCode)) {
        kb.whisper(username, 'Provided code is invalid.');
        return;
      }

      const checkUser = await kb.query(
        `
            SELECT *
            FROM access_token
            WHERE user=? AND platform="lastfm"`,
        [userId]
      );

      if (!_.isEmpty(checkUser)) {
        kb.whisper(username, 'You are already registered for LastFM command.');
        await kb.query(
          `
                DELETE FROM access_token
                WHERE code=?`,
          [code]
        );
        return;
      }

      await kb.query(
        `
            UPDATE access_token
            SET userName=?, user=?, code="lastfm"
            WHERE code=?`,
        [username.replace('#', ''), userId, code]
      );

      kb.whisper(
        username,
        'All done! You can now use the Lastfm command like that :) 👉 kb lastfm  or kb music. Aliases are: kb music [allow/disallow/unregister]'
      );
      return;
    }

    if (codePrefix === 'verify-spotify') {
      const checkBan = await kb.query(
        `
            SELECT *
            FROM ban_list
            WHERE user_id=?`,
        [userId]
      );

      if (!_.isEmpty(checkBan)) return;

      const checkCode = await kb.query(
        `
            SELECT *
            FROM access_token
            WHERE code=?`,
        [code]
      );

      if (_.isEmpty(checkCode)) {
        kb.whisper(username, 'Provided code is invalid.');
        return;
      }

      const checkUser = await kb.query(
        `
            SELECT *
            FROM access_token
            WHERE user=? AND platform="spotify"`,
        [userId]
      );

      if (!_.isEmpty(checkUser)) {
        kb.whisper(username, 'You are already registered for Spotify command.');
        await kb.query(
          `
                DELETE FROM access_token
                WHERE code=?`,
          [code]
        );
        return;
      }

      await kb.query(
        `
            UPDATE access_token
            SET userName=?,
                user=?,
                code="Resolved",
                lastRenew=?
            WHERE code=?`,
        [username.replace('#', ''), userId, moment().format('YYYY-MM-DD hh:mm:ss'), code]
      );

      kb.whisper(
        username,
        `All done! You can now use the Spotify command. If you have Spotify premium,
            check out command parameters under kb help spotify. Note that you can use these parameters
            the main command like: kb skip, kb vol 10 etc. To allow other users to check out your
            playing songs type "kb spotify allow"`
      );
    }
  });
};

module.exports = botCodeResolverWhisperManager;
