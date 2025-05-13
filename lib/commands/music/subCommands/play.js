const _ = require('lodash');

const executeSpotifyAction = require('../utils/executeSpotifyAction');

const play = async (context, { Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  const action = {
    type: 'play',
    execute: async (Commons, track, userId) => {
      const payload = { uris: [_.get(track, 'uri')], position_ms: 0 };
      await Commons.UserRepository().spotifyFetchWithOauth('PUT', `/v1/me/player/play`, {
        userId,
        isSender: true,
        payload
      });
    },
    responseMessage: responses.MUSIC.SUCCESS.NOW_PLAYING
  };

  return executeSpotifyAction(context, { Commons }, action);
};

module.exports.invocation = play;
