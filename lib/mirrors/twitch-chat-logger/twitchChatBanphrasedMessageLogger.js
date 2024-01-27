const serviceConnector = require('../../../connector/serviceConnector');

const utils = require('../../utils/utils');

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit']);

  await kb.rabbitClient.createRabbitChannel(
    'KB_DETECTED_BANPHRASE',
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

// TODO: healthcheck with expressjs
