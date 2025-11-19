const _ = require('lodash');

const validateNamechange = async (context, { Commons }, username = null) => {
  const responses = Commons.ResponseRepository().getResponses();

  let userToCheck = await Commons.UserRepository().getUser({ username });

  if (!_.size(userToCheck)) {
    return { error: true, response: responses.NAMECHANGE.ERRORS.USERNAME_NOT_FOUND };
  }

  const userId = _.get(_.first(userToCheck), 'userId');
  userToCheck = await Commons.UserRepository().getUser({ userId });

  if (userToCheck < 2) {
    return { error: true, response: responses.NAMECHANGE.ERRORS.NO_NAME_CHANGES };
  }

  const isUserOptedOut = await Commons.UserRepository().isUserOptedOut('namechange', {
    userId
  });

  if (isUserOptedOut && context.userstate['user-id'] !== userId) {
    return { error: true, response: responses.COMMON.ERRORS.OPTED_OUT };
  }

  return { error: false, userToCheck, userId };
};

module.exports = validateNamechange;
