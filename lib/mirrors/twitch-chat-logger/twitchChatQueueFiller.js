const moment = require('moment');
const _ = require('lodash');

const serviceConnector = require('../../../connector/serviceConnector');

const moduleName = 'logger';

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['websocket', 'tmi', 'rabbit']);

  const mpsCache = [];

  kb.tmiClient.tmiEmitter.on('message', async (channel, user, message) => {
    mpsCache.push(moment().unix());

    await kb.rabbitClient.sendToQueue('KB_TWITCH_CHAT_MESSAGES', {
      channel: _.replace(channel, '#', _.stubString()),
      username: user['username'],
      'user-id': user['user-id'],
      color: user['color'],
      message,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
    });
  });

  kb.tmiClient.tmiEmitter.on('notice', async (channel, msgId, message) => {
    if (msgId === 'host_target_went_offline' || msgId === 'host_on') {
      return;
    }

    await kb.rabbitClient.sendToQueue('KB_TWITCH_CHAT_NOTICE', {
      channel: _.replace(channel, '#', _.stubString()),
      message,
      msgId,
      moduleName,
    });
  });

  kb.tmiClient.tmiEmitter.on('usernotice', async msg => {
    const msgId = msg.messageTypeID;
    const channel = msg.channelName;

    if (msgId === 'host_target_went_offline' || msgId === 'host_on') {
      return;
    }

    await kb.rabbitClient.sendToQueue('KB_TWITCH_CHAT_NOTICE', {
      msgId,
      message: _.get(msg, "systemMessage"),
      channel: _.replace(channel, '#', _.stubString()),
      moduleName
    });
  });

  setInterval(() => {
    kb.websocketClient.websocketEmitter.emit('/wsl', {
      type: 'mps',
      data: mpsCache.filter(mps => mps < moment().unix() - 1000),
    });

    mpsCache.length = 0;
  }, 3000);
})();

// TODO: healthcheck with expressjs
