const serviceConnector = require('../../../connector/serviceConnector');
const serviceSettings = require('../../../consts/serviceSettings.json');

const utils = require('../../utils/utils');

const service = serviceSettings.services.twitchChatBanphrasedMessageLogger;

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit'],{
    enableHealthcheck: true,
    service,
  });

  await kb.rabbitClient.createRabbitChannel(
    service.queues.KB_DETECTED_BANPHRASE,
    async (msg, consumer, rawMsg) => {
      const { channel, username, message, date } = msg;

      if (!channel || !username || !message || !date) {
        await consumer.ack(rawMsg);
        return;
      }

      const banphraseCheck = await utils.banphrasePass(username, channel);

      await kb.sqlClient.query(
        `
              INSERT INTO bruh (username, channel, message, date, detectedByApi)
              VALUES (?, ?, ?, ?)`,
        [username, channel, message, date, banphraseCheck.banned]
      );

      await consumer.ack(rawMsg);
    },
    { prefetchCount: 1, delayProcessing: 2_000 }
  );
})();
