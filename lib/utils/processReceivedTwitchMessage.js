const _ = require('lodash');
const requireDir = require('require-dir');
const moment = require('moment');

const songHandlerWhitelist = require('./songHandlerWhitelist');

const prefix = process.env.PREFIX || 'kb';

const commandsDir = requireDir('../commands', {
  recurse: true,
  resolve: 'sync'
});

const commands = _.reduce(
  _.entries(commandsDir),
  (acc, [commandDir, file]) => {
    if (file[commandDir]) {
      acc[commandDir] = file[commandDir];
    }
    return acc;
  },
  {}
);

const processReceivedTwitchMessage = async (
  { channelName, user, message, self, startTime },
  { kb, Commons }
) => {
  if (self) return null;

  const standarizationOutput =
    await Commons.UtilityRepository(kb).standarizeUserInput(message);

  const standarizedUserInput = standarizationOutput.convertedText;

  let [userPrefix, userCommand] = _.take(_.split(standarizedUserInput, ' '), 2);
  let userInput = _.join(_.drop(_.split(standarizedUserInput, ' '), 2), ' ');

  if (channelName === 'pajlada') {
    if (message === 'pajaS 🚨 ALERT' && user['user-id'] === '82008718') {
      return {
        messageContext: kb.tmiClient.sender.action,
        response: _.sample(['KKurwa 🚨 NAURA', 'Clue TeaTime 🚨 TMI MELTDOWN'])
      };
    }

    if (message.startsWith('/announce') && user['user-id'] === '258811155') {
      return {
        response: '/announce 2⃣ _? 😂'
      };
    }
  }

  if (_.first(_.split(message, ' ')) === '!song') {
    if (songHandlerWhitelist[channelName]) {
      [userPrefix, userCommand, userInput] = _.split(songHandlerWhitelist[channelName], ' ');
    }
  }

  if (_.toLower(userPrefix) !== prefix) return null;
  if (!_.get(commands, userCommand)) return null;

  const isUserOnCooldown = await Commons.UserRepository(kb).isUserOnCooldown(
    userCommand,
    user
  );
  if (isUserOnCooldown) return null;

  const isUserBannedFromBot = await Commons.UserRepository(kb).isUserBanned(user);
  if (isUserBannedFromBot) return null;

  const isCommandProcessing =
    await Commons.UtilityRepository(kb).isBlockingCommandProcessing(userCommand);

  if (isCommandProcessing) {
    return {
      response:
        "Command is currently processing another user's request. Please try again later."
    };
  }

  let invokedCommandResult = null;
  const standarizedMessageParts = { userPrefix, userCommand, userInput };

  try {
    invokedCommandResult = await commands[userCommand].invocation(
      {
        channelName,
        userstate: user,
        originalMessage: message,
        standarizationOutput,
        standarizedMessageParts,
        startTime
      },
      {
        kb,
        Commons
      }
    );

    try {
      await kb.sqlClient.query(
        `
          INSERT INTO executions (username, command, result, channel, date)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          _.get(user, 'username'),
          _.trim(`${userCommand} ${userInput}`),
          _.toString(_.get(invokedCommandResult, 'response', '')).slice(0, 500),
          channelName
        ]
      );
    } catch (loggingError) {
      console.error(
        '[processReceivedTwitchMessage] Failed to log command execution:',
        loggingError
      );
    }
  } catch (err) {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} Error invoking command:`, err);

    return {
      invokedCommandResult: {
        response: 'error has occurred while executing your command.'
      },
      standarizedMessageParts,
      context: { channelName, user, message }
    };
  }

  return {
    invokedCommandResult,
    context: { channelName, user, message },
    standarizedMessageParts
  };
};

module.exports = processReceivedTwitchMessage;
