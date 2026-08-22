const _ = require('lodash');
const got = require('got');
const updateChatterList = async kb => {
  const channelList = await kb.redisClient.get('kb:global:channel-list');

  if (_.isEmpty(channelList)) throw new Error('Channel list not set in Redis');

  const lastSeenChatters = await kb.sqlClient.query(
    `SELECT username, lastSeen 
    FROM user_list WHERE STR_TO_DATE(SUBSTRING_INDEX(lastSeen, '*', 1), '%Y-%m-%d %H:%i:%s')
    BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND NOW();`
  );

  let i = 0;

  const updatePromises = channelList.map(channelName => {
    return new Promise(resolve => {
      setTimeout(async () => {
        let result = null;

        try {
          const options = {
            method: 'POST',
            url: 'https://gql.twitch.tv/gql',
            headers: {
              Accept: '*/*',
              'Accept-Language': 'pl-PL',
              'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
              Connection: 'keep-alive',
              'Content-Type': 'text/plain;charset=UTF-8',
              Origin: 'https://www.twitch.tv',
              Referer: 'https://www.twitch.tv/',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
              'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
            },
            body: `[{"operationName":"CommunityTab","variables":{"login":"${channelName}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"2e71a3399875770c1e5d81a9774d9803129c44cf8f6bad64973aa0d239a88caf"}}}]`,
          };

          result = await got(options).json();
        } catch (err) {
          console.error({
            message: 'Error while sending request to Twitch GQL',
            source: 'updateChatterList',
            errorMessage: err.message,
            timestamp: new Date(),
          });
          return resolve();
        }

        const chatters = _.get(result, '0.data.user.channel.chatters', {});

        const activeChattersInChat = _.chain(chatters)
          .values()
          .flatMap(chatterGroup => _.map(chatterGroup, 'login'))
          .compact()
          .value();

        _.forEach(lastSeenChatters, chatter => {
          const lastSeenParts = _.split(_.get(chatter, 'lastSeen'), '*');

          if (_.get(lastSeenParts, '1') === channelName) {
            activeChattersInChat.push(_.first(lastSeenParts));
          }
        });

        await kb.redisClient.set(
          `kb:channel:${channelName}:chatters`,
          activeChattersInChat,
          60 * 60 * 24 * 14
        );

        resolve();
      }, 5_000 * i);

      i++;
    });
  });

  await Promise.all(updatePromises);
};

module.exports = updateChatterList;
