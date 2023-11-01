const _ = require('lodash');

const serviceConnector = require('../../connector/serviceConnector');

const sendRedditMessageToQueue = require('./utils/sendRedditMessageToQueue');

(async () => {
  const kb = await serviceConnector.Connector.dependencies([
    'sql',
    'redis',
    'rabbit',
    'reddit',
    'discord',
  ]);

  sendRedditMessageToQueue(kb);

  kb.discordClient.native.on('ready', async () => {
    await kb.rabbitClient.createRabbitChannel('KB_HANDLER_REDDIT_LIVETHREADS');

    kb.rabbitClient.rabbitEmitter.on(
      'KB_HANDLER_REDDIT_LIVETHREADS',
      async (msg, msgRaw, consumer) => {
        const jsonMessage = JSON.parse(msg);

        let body = _.get(jsonMessage, 'body', "");

        if (!body) {
          consumer.ack(msgRaw);
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

        consumer.ack(msgRaw);
      }
    );
  });
})();
