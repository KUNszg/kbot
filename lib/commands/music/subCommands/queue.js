const _ = require('lodash');

const searchSpotifySong = require('./utils/searchSpotifySong');

const queue = async (context, { Commons }) => {
  const message = _.get(context, 'userInputPartsWithNoSubCommand');

  if (_.isEmpty(message)) {
    return {
      response: 'please provide a song to queue.'
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

  try {
    await Commons.UserRepository().spotifyFetchWithOauth(
      'POST',
      `/v1/me/player/queue?uri=${_.get(track, 'uri')}`,
      userId,
      true
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
    response: `queued ${songTitle} by ${artistName} on your Spotify.`
  };
};

module.exports.invocation = queue;
