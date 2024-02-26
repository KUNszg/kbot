const got = require('got');
const _ = require('lodash');

const config = require('../../credentials/config');

const updateChatterList = async kb => {
  const channelList = await kb.redisClient.get('kb:global:channel-list');

  for (let channelName of channelList) {
    const options = {
      method: 'POST',
      url: 'https://gql.twitch.tv/gql',
      headers: {
        Accept: '*/*',
        'Accept-Language': 'pl-PL',
        'Client-Id': config.chatterListClientId,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'text/plain',
        Cookie: 'twitch.lohp.countryCode=EN',
      },
      body: `[{"operationName":"CommunityTab","variables":{"login":"${channelName}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"2e71a3399875770c1e5d81a9774d9803129c44cf8f6bad64973aa0d239a88caf"}}}]`,
    };

    setTimeout(async () => {
      const result = await got(options).json();

      const defaultPath = '0.data.user.channel.chatters';

      const mods = _.get(result, `${defaultPath}.moderators`);
      const broadcasters = _.get(result, `${defaultPath}.broadcasters`);
      const vips = _.get(result, `${defaultPath}.vips`);
      const staff = _.get(result, `${defaultPath}.staff`);
      const viewers = _.get(result, `${defaultPath}.viewers`);

      await kb.redisClient.set(
        `kb:channel:${channelName}:chatters`,
        _.map(_.concat(mods, broadcasters, vips, staff, viewers), 'login'),
        60 * 60 * 24 * 14
      );
    }, 5_000);
  }
};

module.exports = updateChatterList;