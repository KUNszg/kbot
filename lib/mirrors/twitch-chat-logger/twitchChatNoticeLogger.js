const serviceConnector = require('../../../connector/serviceConnector');

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit']);

  await kb.rabbitClient.createRabbitChannel(
    'KB_TWITCH_CHAT_MESSAGES',
    async (msg, consumer, rawMsg) => {
      const { channel, message, msgId, moduleName } = msg;

      if (!channel || !message || !msgId || !moduleName) {
        console.error(
          'ERROR: Received invalid message in notice logger: ' + JSON.stringify(msg)
        );
        consumer.ack(rawMsg);
        return;
      }

      await kb.sqlClient.query(
        `
                INSERT INTO notice (msgid, message, channel, module, date)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [msgId, message, channel, moduleName]
      );

      consumer.ack(rawMsg);
    }
  );
})();

// TODO: healthcheck with expressjs

