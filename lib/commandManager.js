const _ = require('lodash');

const Commons = require('../commons/Commons');
const { startHeartbeat } = require('../commons/connector/utils/heartbeat');

const processReceivedTwitchMessage = require('./utils/processReceivedTwitchMessage');
const postprocessCommandResponse = require('./utils/postprocessCommandResponse');
const responseSettings = require('./utils/consts/response-settings.json');

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies([
    'tmi',
    'sql',
    'redis',
    'rabbit'
    // 'reddit', // todo:
    // 'discord', // todo:
    // 'websocket', // todo:
  ]);

  try {
    await kb.redisClient
      .multi()
      .set('kb:command-manager:botStartedAt', JSON.stringify(Date.now()))
      .exec();
  } catch (error) {
    console.error('[CommandManager] Failed to publish bot start time:', error);
  }

  startHeartbeat(kb, 'kbot-backend');

  const MESSAGE_RATE_INTERVAL_MS = 10000;
  let receivedMessageCount = 0;

  setInterval(async () => {
    const messagesPerSecond = receivedMessageCount / (MESSAGE_RATE_INTERVAL_MS / 1000);
    receivedMessageCount = 0;

    try {
      await kb.redisClient
        .multi()
        .set('kb:command-manager:messageRate', JSON.stringify(messagesPerSecond))
        .exec();
    } catch (error) {
      console.error('[CommandManager] Failed to publish message rate:', error);
    }
  }, MESSAGE_RATE_INTERVAL_MS);

  const processTwitchChatMessage = async (channel, user, message, self) => {
    receivedMessageCount++;

    const startTime = process.hrtime();
    const channelName = _.startsWith(channel, '#') ? _.replace(channel, '#', '') : channel;

    let processedMessageResult;

    try {
      processedMessageResult = await processReceivedTwitchMessage(
        {
          channelName,
          user,
          message,
          self,
          startTime
        },
        { kb, Commons }
      );
    } catch (error) {
      console.error(
        `[CommandManager] Error processing message from ${user['display-name']} in ${channelName}:`,
        error
      );
      return;
    }

    const invokedCommandResult = _.get(processedMessageResult, 'invokedCommandResult');

    // todo: write a logger that logs each execution to db, and at the same time formats logs into some standard like GELF,
    //  log to database should be optional (allowed by passing some variable) and log to console default

    if (!invokedCommandResult || !invokedCommandResult.response) return;

    if (invokedCommandResult.mentionExecutorInResponse !== false) {
      invokedCommandResult.response = `${user['display-name']}, ${invokedCommandResult.response}`;
    }

    if (!invokedCommandResult.messageContext) {
      invokedCommandResult.messageContext = _.bind(
        kb.tmiClient.sender.say,
        kb.tmiClient.sender
      );
    }

    invokedCommandResult.response = postprocessCommandResponse(
      processedMessageResult,
      responseSettings
    );

    if (!invokedCommandResult.response) {
      invokedCommandResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - postprocessor response content is empty!`
      );
      return;
    }

    let isResponseContainingMassping = false;
    try {
      isResponseContainingMassping = await Commons.ChannelRepository(kb).isMasspingInText(
        processedMessageResult.context.channelName,
        invokedCommandResult.response
      );
    } catch (error) {
      console.warn(
        `[CommandManager] Error checking massping for ${channelName}:`,
        error.message
      );
    }

    if (
      isResponseContainingMassping &&
      !_.includes(
        responseSettings.commandsWithAllowedMassping,
        invokedCommandResult.standarizedMessageParts.userCommand
      )
    ) {
      invokedCommandResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - response contains massping!`
      );
      return;
    }

    let isContentBanphrasedResult = { banned: false };
    try {
      isContentBanphrasedResult = await Commons.ChannelRepository(kb).checkBanphraseInText(
        processedMessageResult.context.channelName,
        invokedCommandResult.response
      );
    } catch (error) {
      invokedCommandResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - banphrase check failed!`
      );
      return;
    }

    if (!!isContentBanphrasedResult.banned) {
      invokedCommandResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - response content is banphrased!`
      );
      return;
    }

    try {
      await invokedCommandResult.messageContext(
        processedMessageResult.context.channelName,
        invokedCommandResult.response
      );
    } catch (error) {
      console.error(`[CommandManager] Failed to send message to ${channelName}:`, error);
    }
  };

  const twitchEventHandlers = {
    action: processTwitchChatMessage,
    message: processTwitchChatMessage,
    notice: async (channel, messageId, message) => {
      if (!!_.includes(responseSettings.receivedNoticeTypesToIgnore, messageId)) {
        return;
      }

      if (messageId === 'msg_rejected_mandatory') {
        try {
          kb.tmiClient.sender.say(
            channel,
            'This message could not be posted due to this channels banphrase/moderation settings'
          );
        } catch (error) {
          console.error(`[CommandManager] Failed to send notice to ${channel}:`, error);
        }
      }
    },
    whisper: async (username, user, message, self) => {
      // await processReceivedWhisper(username, user, message, self, 'whisper');
    }
  };

  for (const [event, handler] of _.entries(twitchEventHandlers)) {
    kb.tmiClient.consumer.tmiEmitter.on(event, handler);
  }

  console.log('[CommandManager] Twitch event handlers initialized successfully');
})();
