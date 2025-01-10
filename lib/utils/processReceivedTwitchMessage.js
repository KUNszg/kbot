const _ = require('lodash');
const requireDir = require('require-dir');
const moment = require('moment');

const songHandlerWhitelist = require('./songHandlerWhitelist');

const prefix = process.env.PREFIX || 'kb';
const commands = requireDir('./commands');

const processReceivedTwitchMessage = async (
  { channelName, user, message, self },
  { kb, Commons }
) => {
  if (self) return null;

  const standarizationOutput = await Commons.UtilityRepository(kb).standarizeUserInput(
    message
  );

  const standarizedUserInput = standarizationOutput.convertedText;

  let [userPrefix, userCommand, userInput] = _.split(standarizedUserInput, ' ', 3);

  if (channelName === 'pajlada') {
    if (message === 'pajaS 🚨 ALERT' && user['user-id'] === '82008718') {
      return {
        messageContext: kb.tmiClient.action,
        response: _.sample(['KKurwa 🚨 NAURA', 'Clue TeaTime 🚨 TMI MELTDOWN']),
      };
    }

    if (message.startsWith('/announce') && user['user-id'] === '258811155') {
      return {
        response: '/announce 2⃣ _? 😂',
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

  const isCommandProcessing = await Commons.UtilityRepository(kb).isBlockingCommandProcessing(
    userCommand
  );

  if (isCommandProcessing) {
    return {
      response:
        "Command is currently processing another user's request. Please try again later.",
      mentionExecutorInResponse: true,
    };
  }

  let invokedCommandResult = null;
  const standarizedMessageParts = { userPrefix, userCommand, userInput };

  try {
    invokedCommandResult = _.call(commands[userCommand].invocation, [
      {
        channelName,
        userstate: user,
        originalMessage: message,
        standarizationOutput,
        standarizedMessageParts,
      },
      {
        kb,
        Commons,
      },
    ]);
  } catch (err) {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} Error invoking command:`, err);
  }

  return {
    invokedCommandResult,
    context: { channelName, user, message },
    standarizedMessageParts,
  };
};

module.exports = processReceivedTwitchMessage;
