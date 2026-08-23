const moment = require('moment');
const _ = require('lodash');

const serviceSettings = require('../../../consts/serviceSettings.json');
const serviceConnector = require('../../../commons/connector/serviceConnector');
const { startHeartbeat } = require('../../../commons/connector/utils/heartbeat');

const service = serviceSettings.services.twitchChatQueueFiller;

const moduleName = 'logger';

(async () => {
  const kb = await serviceConnector.Connector.dependencies(
    ['websocket', 'tmi', 'rabbit', 'redis'],
    {
      enableHealthcheck: true,
      service
    }
  );

  startHeartbeat(kb, 'twitch-chat-queue-filler');

  const mpsCache = [];

  kb.tmiClient.consumer.tmiEmitter.on('message', async (channel, user, message) => {
    mpsCache.push(moment().unix());

    await kb.rabbitClient.sendToQueue(
      service.queues.KB_TWITCH_CHAT_MESSAGES,
      {
        channel: _.replace(channel, '#', _.stubString()),
        username: user['username'],
        'user-id': user['user-id'],
        color: user['color'],
        message,
        date: moment().format('YYYY-MM-DD HH:mm:ss')
      },
      { checkLimit: true, maxQueueSize: 10000 }
    );
  });

  // todo:
  // kb.tmiClient.consumer.tmiEmitter.on('notice', async (channel, msgId, message) => {
  //   if (msgId === 'host_target_went_offline' || msgId === 'host_on') {
  //     return;
  //   }
  //
  //   await kb.rabbitClient.sendToQueue(service.queues.KB_TWITCH_CHAT_NOTICE, {
  //     channel: _.replace(channel, '#', _.stubString()),
  //     message,
  //     msgId,
  //     moduleName,
  //   });
  // });
  //
  // kb.tmiClient.consumer.tmiEmitter.on('usernotice', async msg => {
  //   const msgId = msg.messageTypeID;
  //   const channel = msg.channelName;
  //
  //   if (msgId === 'host_target_went_offline' || msgId === 'host_on') {
  //     return;
  //   }
  //
  //   await kb.rabbitClient.sendToQueue(service.queues.KB_TWITCH_CHAT_NOTICE, {
  //     msgId,
  //     message: _.get(msg, 'systemMessage'),
  //     channel: _.replace(channel, '#', _.stubString()),
  //     moduleName,
  //   });
  // });

  setInterval(() => {
    kb.websocketClient.websocketEmitter.emit('/wsl', {
      type: 'mps',
      data: mpsCache.filter(mps => mps < moment().unix() - 1000)
    });

    mpsCache.length = 0;
  }, 3000);
})();
