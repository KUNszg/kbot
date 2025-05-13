const _ = require('lodash');

const validateUser = async (context, { Commons }, username = null) => {
  const responses = Commons.ResponseRepository().getResponses();

  const getUser = username ? await Commons.UserRepository().getUser({ username }) : null;

  const userId = _.get(getUser, 'userId') || _.get(context, 'userstate.user-id');

  if (_.isEmpty(userId)) {
    return { error: true, response: responses.COMMON.ERRORS.USER_NOT_FOUND };
  }

  const isUserOptedOut = await Commons.UserRepository().isUserOptedOut('music', { userId });

  if (isUserOptedOut && _.get(context, 'userstate.user-id') !== userId) {
    return { error: true, response: responses.COMMON.ERRORS.OPTED_OUT };
  }

  return { error: false, userId, username };
};

module.exports = validateUser;
