const _ = require('lodash');

const executeSpotifyAction = require('../utils/executeSpotifyAction');

const queue = async (context, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  const action = {
    type: 'queue',
    execute: async (Commons, track, userId) => {
      await Commons.UserRepository().spotifyFetchWithOauth(
        'POST',
        `/v1/me/player/queue?uri=${_.get(track, 'uri')}`,
        {
          userId,
          isSender: true
        }
      );
    },
    responseMessage: responses.MUSIC.SUCCESS.QUEUED
  };

  return executeSpotifyAction(context, { Commons }, action);
};

module.exports.invocation = queue;
