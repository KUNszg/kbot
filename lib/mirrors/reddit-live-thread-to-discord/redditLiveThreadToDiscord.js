const _ = require('lodash');

const serviceConnector = require('../../../connector/serviceConnector');
const serviceSettings = require('../../../consts/serviceSettings.json');

const sendRedditMessageToQueue = require('./utils/sendRedditMessageToQueue');

const service = serviceSettings.services.redditLiveThreadToDiscord;

(async () => {
  const kb = await serviceConnector.Connector.dependencies([
    'sql',
    'redis',
    'rabbit',
    'reddit',
    'discord',
  ], {
    enableHealthcheck: true,
    service,
  });

  sendRedditMessageToQueue(kb, service.queues.KB_HANDLER_REDDIT_LIVETHREADS);

  kb.discordClient.native.on('ready', async () => {
    await kb.rabbitClient.createRabbitChannel(
      service.queues.KB_HANDLER_REDDIT_LIVETHREADS,
      async (msg, consumer, msgRaw) => {
        const jsonMessage = JSON.parse(msg);

        let body = _.get(jsonMessage, 'body', "");

        if (!body) {
          await consumer.ack(msgRaw);
          return;
        }

        body = body.replace("https://twitter", "https://fxtwitter");

        const liveThreadChannels = await kb.sqlClient.query(
          'SELECT * FROM liveThreadChannels'
        );

        _.forEach(liveThreadChannels, liveThreadChannel => {
          const channel = kb.discordClient.native.channels.cache.find(
            channel => channel.id === liveThreadChannel.channelID
          );

          kb.sqlClient.query(
            `INSERT INTO livethreads (data, date) VALUES (?, CURRENT_TIMESTAMP)`,
            [msg]
          );

          if (liveThreadChannel.threadID) {
            const thread = channel.threads.cache.find(
              thread => thread.id === liveThreadChannel.threadID
            );

            thread.send(body);
          } else if (channel) {
            channel.send(body);
          }
        });

        await consumer.ack(msgRaw);
      }
    );
  });
})();
