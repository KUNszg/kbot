const serviceConnector = require('../../../commons/connector/serviceConnector');
const { startHeartbeat } = require('../../../commons/connector/utils/heartbeat');
const serviceSettings = require('../../../consts/serviceSettings.json');

const service = serviceSettings.services.twitchChatNoticeLogger;

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit', 'redis'], {
    enableHealthcheck: true,
    service,
  });

  startHeartbeat(kb, 'twitch-chat-notice-logger');

  await kb.rabbitClient.createRabbitChannel(
    service.queues.KB_TWITCH_CHAT_NOTICE,
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
