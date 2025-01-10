const _ = require('lodash');

const Commons = require('../commons/Commons');

const processReceivedTwitchMessage = require('./utils/processReceivedTwitchMessage');
const postprocessCommandResponse = require('./utils/postprocessCommandResponse');
const isContentBanphrased = require('./utils/isContentBanphrased');
const responseSettings = require('./utils/consts/response-settings.json');

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies([
    'tmi',
    'sql',
    'redis',
    'rabbit',
    // 'reddit', // todo:
    // 'discord', // todo:
    // 'websocket', // todo:
  ]);

  const processTwitchChatMessage = async (channel, user, message, self) => {
    const channelName = _.startsWith(channel, '#') ? _.replace(channel, '#', '') : channel;

    let processedMessageResult = await processReceivedTwitchMessage(
      {
        channelName,
        user,
        message,
        self,
      },
      { kb, Commons }
    );

    processedMessageResult = _.get(processedMessageResult, 'invokedCommandResult');

    // todo: write a logger that logs each execution to db, and at the same time formats logs into some standard like GELF,
    //  log to database should be optional (allowed by passing some variable) and log to console default

    if (!processedMessageResult || !processedMessageResult.response) return;

    if (processedMessageResult.mentionExecutorInResponse) {
      processedMessageResult.response = `${user['display-name']}, ${processedMessageResult.response}`;
    }

    if (!processedMessageResult.messageContext) {
      processedMessageResult.messageContext = kb.tmiClient.say;
    }

    processedMessageResult.response = postprocessCommandResponse(
      processedMessageResult,
      responseSettings
    );

    if (!processedMessageResult.response) {
      processedMessageResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - postprocessor response content is empty!`
      );
      return;
    }

    const isResponseContainingMassping = await Commons.ChannelRepository(kb).isMasspingInText(
      processedMessageResult.context.channelName,
      processedMessageResult.response
    );

    if (
      isResponseContainingMassping &&
      !_.includes(
        responseSettings.commandsWithAllowedMassping,
        processedMessageResult.standarizedMessageParts.userCommand
      )
    ) {
      processedMessageResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - response contains massping!`
      );
      return;
    }

    const isContentBanphrasedResult = await Commons.ChannelRepository(kb).checkBanphraseInText(
      processedMessageResult.context.channelName,
      processedMessageResult.response
    );

    if (!!isContentBanphrasedResult.banned) {
      processedMessageResult.messageContext(
        processedMessageResult.context.channelName,
        `${user['display-name']}, can't post response message - response content is banphrased!`
      );
      return;
    }

    processedMessageResult.messageContext(
      processedMessageResult.context.channelName,
      processedMessageResult.response
    );
  };

  const twitchEventHandlers = {
    action: processTwitchChatMessage,
    message: processTwitchChatMessage,
    notice: async (channel, messageId, message) => {
      if (!!_.includes(responseSettings.receivedNoticeTypesToIgnore, messageId)) {
        return;
      }

      if (messageId === 'msg_rejected_mandatory') {
        kb.tmiClient.say(
          channel,
          'This message could not be posted due to this channels banphrase/moderation settings'
        );
      }
    },
    whisper: async (username, user, message, self) => {
      // await processReceivedWhisper(username, user, message, self, 'whisper');
    },
    timeout: (channel, username, message, duration, msg) => {
      if (channel === '#supinic') {
        if (duration === '1') {
          kb.tmiClient.say(channel, `${username} vanished Article13 MagicTime`);
        } else if (msg.isPermaban()) {
          kb.tmiClient.say(channel, `${username} has been permanently banned MODS Clap`);
        } else {
          kb.tmiClient.say(
            channel,
            `${username} has been timed out for ${duration}s Article13 MagicTime`
          );
        }
      }
    },
  };

  for (const [event, handler] of _.entries(twitchEventHandlers)) {
    kb.tmiClient.tmiEmitter.on(event, handler);
  }
})();
