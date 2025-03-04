const _ = require('lodash');

const namechange = async (context, { kb, Commons }) => {
  const userInput = _.first(_.split(_.get(context, 'standarizedMessageParts.userInput'), ' '));

  const username = !userInput ? context.userstate.username : _.replace(userInput, /@|,/g, '');

  let userToCheck = await Commons.UserRepository(kb).getUser({ username });

  const userToCheckSize = _.size(userToCheck);

  if (!userToCheckSize) {
    return {
      response: 'username was not found.',
    };
  }

  const userId= _.get(_.first(userToCheck),"userId");

  userToCheck = await Commons.UserRepository(kb).getUser({ userId });

  if (userToCheck < 2) {
    return {
      response: 'no name changes were found.',
    };
  }

  const isUserOptedOut = await Commons.UserRepository(kb).isUserOptedOut('namechange', { userId });

  if (isUserOptedOut && context.userstate["user-id"] !== userId) {
    return {
      response: 'that user has opted out from being a target of this command.',
    };
  }

  let usernames = _.join(_.map(userToCheck, i => i.username), ' => ');


  if (usernames > 445) {
    usernames = _.join(_.slice(_.split(usernames, ''), 0, 440), "") + '...';
  }

  return {
    response: `name changes detected (${_.size(userToCheck) - 1}): ${usernames}`
  };
};

module.exports.invocation = namechange;
