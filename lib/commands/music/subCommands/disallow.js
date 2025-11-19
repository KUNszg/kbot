const _ = require('lodash');

const disallow = async (context, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
  const userId = _.get(context, 'userstate.user-id');

  await kb.sqlClient.query(
    ` 
      UPDATE access_token
      SET allowLookup='N'
      WHERE platform='spotify' AND user=?`,
    [userId]
  );

  return {
    response: responses.MUSIC.COMMANDS.DISALLOW
  };
};

module.exports.invocation = disallow;
