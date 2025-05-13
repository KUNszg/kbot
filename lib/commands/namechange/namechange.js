const _ = require('lodash');

const validateNamechange = require('./utils/namechangeValidator');

const namechange = async (context, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
  const userInput = _.first(_.split(_.get(context, 'standarizedMessageParts.userInput'), ' '));
  const username = !userInput ? context.userstate.username : _.replace(userInput, /@|,/g, '');

  const validation = await validateNamechange(context, { Commons }, username);
  if (validation.error) {
    return validation.response;
  }

  const { userToCheck } = validation;
  let usernames = _.join(
    _.map(userToCheck, i => i.username),
    ' => '
  );

  if (usernames.length > 445) {
    usernames = _.join(_.slice(_.split(usernames, ''), 0, 440), '') + '...';
  }

  return {
    response: responses.NAMECHANGE.SUCCESS.NAME_CHANGES(_.size(userToCheck) - 1, usernames)
  };
};

module.exports.invocation = namechange;
