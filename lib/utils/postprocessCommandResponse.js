const _ = require('lodash');

const regex = require('../../consts/regex');

const postprocessCommandResponse = (commandResult, responseSettings) => {
  let result = commandResult.response;

  if (
    _.includes(responseSettings.channelsRestrictingLinks, commandResult.context.channelName)
  ) {
    const links = _.get(commandResult, 'response', '').match(regex.url);

    if (!_.isEmpty(links)) {
      result = _.reduce(
        links,
        (updatedResult, link) => {
          const sanitizedLink = _.replace(
            _.replace(link, /(https:\/\/|http:\/\/)?(www\.)?/g, ''),
            /\./g,
            '(dot)'
          );
          return _.replace(updatedResult, link, sanitizedLink);
        },
        result
      );
    }
  }

  if (result.match(regex.racism) != null) {
    return "can't post response message - bad word detected in response :z";
  }

  return result;
};

module.exports = postprocessCommandResponse;
