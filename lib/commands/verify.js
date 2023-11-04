const _ = require('lodash');
const moment = require('moment/moment');

const utils = require('../utils/utils');

module.exports = {
  name: 'kb verify-lastfm',
  invocation: async (channel, user, message, event, messageState, kb) => {
    const code = utils.getParam(message);

    const { userId = user['user-id'], username } = user;

    const checkCode = await kb.sqlClient.query(
      `
            SELECT platform
            FROM access_token
            WHERE code=?`,
      [code]
    );

    if (_.isEmpty(checkCode)) {
      return `${user.username}, provided code is invalid.`;
    }

    const platform = _.get(checkCode, "0.platform");

    const checkUser = await kb.sqlClient.query(
      `
      SELECT COUNT(platform) as count
      FROM access_token 
      WHERE user? AND platform=?`,
      [userId, platform]
    );

    if (_.size(checkUser)) {
      await kb.sqlClient.query(`DELETE FROM access_token WHERE code=?`, [code]);

      return `${user.username}, you are already registered for command kb ${platform}`;
    }

    await kb.sqlClient.query(
      `
            UPDATE access_token
            SET userName=?,
                user=?,
                code="Resolved",
                lastRenew=?
            WHERE code=?`,
      [username.replace('#', ''), userId, moment().format('YYYY-MM-DD hh:mm:ss'), code]
    );

    return `${user.username} All done! You can now use the kb ${platform} command :) Check the command syntax at https://kunszg.com/commands`;
  },
};
