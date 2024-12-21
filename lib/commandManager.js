const _ = require('lodash');

const Commons = require('../commons/Commons');

const songHandlerWhitelist = require('./utils/songHandlerWhitelist');

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies([
    'tmi',
    'sql',
    'redis',
    'rabbit',
    // 'reddit',
    // 'discord',
    // 'websocket',
  ]);

  const prefix = "kb";

  const processReceivedMessage = async (channel, user, message, self) => {
    if (self) return;

    const { convertedText: standarizedUserInput } = Commons.UserRepository(kb).convertTextContainingAlias(message);

    let [userPrefix, userCommand, userInput] = _.split(standarizedUserInput, ' ', 3);

    if (channel === '#pajlada') {
      if (message === 'pajaS 🚨 ALERT' && user['user-id'] === '82008718') {
        kb.action(channel, _.sample(['KKurwa 🚨 NAURA', 'Clue TeaTime 🚨 TMI MELTDOWN']));
        return;
      }

      if (message.startsWith('/announce') && user['user-id'] === '258811155') {
        kb.say(channel, '/announce 2⃣ _? 😂');
        return;
      }
    }

    if (_.first(_.split(message, " ")) === '!song') {
      if (songHandlerWhitelist[channel]) {
        [userPrefix, userCommand, userInput] = _.split(songHandlerWhitelist[channel], " ");
      }
    }

    if (_.toLower(userPrefix) !== prefix) {
      return;
    }


  };

  const twitchEventHandlers = {
    action: async (channel, user, message, self) => {
      await processReceivedMessage(channel, user, message, self);
    },
    message: async (channel, user, message, self) => {
      await processReceivedMessage(channel, user, message, self);
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
          kb.tmiClient.say(channel, `${username} has been timed out for ${duration}s Article13 MagicTime`);
        }
      }
    },
  };

  for (const [event, handler] of Object.entries(twitchEventHandlers)) {
    kb.tmiClient.tmiEmitter.on(event, handler);
  }
})();

