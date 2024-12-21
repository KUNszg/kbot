const got = require('got');
const _ = require('lodash');

const creds = require('../../credentials/config');

const renewTwitchToken = async kb => {
  const tokens = await kb.sqlClient.query(`
    SELECT refresh_token
    FROM access_token
    WHERE platform="twitch"`);

  const refreshToken = _.get(_.first(tokens), "refresh_token");

  const token = await got(
    `https://id.twitch.tv/oauth2/token?client_secret=${creds.client_secret}&grant_type=refresh_token&refresh_token=${refreshToken}`,
    {
      method: 'POST',
      headers: {
        'Client-ID': creds.client_id,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  ).json();

  if (!token || !_.get(token, "access_token")) {
    throw new Error("Twitch refresh token request returned no data");
  }

  await kb.sqlClient.query(
    `
    UPDATE access_token
    SET access_token=?
    WHERE platform="twitch"`,
    [token.access_token]
  );

  await kb.redisClient.set("kb:global:twitch-access-token", token.access_token, token.expires_in)
};

module.exports = renewTwitchToken;