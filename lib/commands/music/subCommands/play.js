const _ = require('lodash');

const searchSpotifySong = require('./utils/searchSpotifySong');

const play = async (context, { Commons }) => {
  const message = _.get(context, 'userInputPartsWithNoSubCommand');

  if (_.isEmpty(message)) {
    return {
      response: 'please provide a song to play.'
    };
  }

  const userId = _.get(context, 'userstate.user-id');

  const searchResult = await searchSpotifySong(
    Commons.UserRepository().spotifyFetchWithOauth.bind(Commons.UserRepository()),
    message,
    userId
  );

  if (_.get(searchResult, 'error') && _.get(searchResult, 'response')) {
    return searchResult.response;
  }

  const spotifySearchEndpointResponse = _.get(searchResult, 'endpointResponse');
  const track = _.get(spotifySearchEndpointResponse, 'tracks.items.0');

  const [artistName, songTitle] = Commons.UtilityRepository().limitInputLength([
    _.get(track, 'artists.0.name'),
    _.get(track, 'name')
  ]);

  const payload = { uris: [_.get(track, 'uri')], position_ms: 0 };

  try {
    await Commons.UserRepository().spotifyFetchWithOauth(
      'PUT',
      `/v1/me/player/play`,
      userId,
      true,
      payload
    );
  } catch (error) {
    if (
      _.includes(
        _.get(error, 'response.body'),
        'Player command failed: No active device found'
      )
    ) {
      return {
        response: `command failed: you need to have your spotify player playing to use this command.`
      };
    }
  }

  return {
    response: `now playing: ${songTitle} by ${artistName} on your Spotify.`
  };
};

module.exports.invocation = play;
