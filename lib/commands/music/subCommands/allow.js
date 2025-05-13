const _ = require('lodash');

const allow = async (context, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
  const userId = _.get(context, 'userstate.user-id');

  await kb.sqlClient.query(
    `
      UPDATE access_token
      SET allowLookup='Y'
      WHERE platform='spotify' AND user=?`,
    [userId]
  );

  return {
    response: responses.MUSIC.COMMANDS.ALLOW
  };
};

module.exports.invocation = allow;
