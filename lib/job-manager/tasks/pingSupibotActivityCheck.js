const got = require('got');
const _ = require('lodash');

const pingSupibotActivityCheck = async kb => {
  const tokens = await kb.sqlClient.query(`
      SELECT user, access_token
      FROM access_token
      WHERE platform="supibot"`);

  const token = _.first(tokens);

  await got(
    `https://supinic.com/api/bot-program/bot/active?auth_user=${token.user}&auth_key=${token.access_token}`,
    {
      method: 'PUT',
    }
  ).json();
};

module.exports = pingSupibotActivityCheck;
