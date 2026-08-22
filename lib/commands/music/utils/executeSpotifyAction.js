const _ = require('lodash');

const searchSpotifySong = require('./searchSpotifySong');

const executeSpotifyAction = async (context, { Commons }, action) => {
  const responses = Commons.ResponseRepository().getResponses();
  const message = _.get(context, 'userInputPartsWithNoSubCommand');

  if (_.isEmpty(message)) {
    return {
      response: responses.MUSIC.ERRORS.NO_SONG_PROVIDED(action.type)
    };
  }

  const userId = _.get(context, 'userstate.user-id');

  try {
    const searchResult = await searchSpotifySong(
      Commons.UserRepository().spotifyFetchWithOauth.bind(Commons.UserRepository()),
      message,
      userId,
      Commons
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

    await action.execute(Commons, track, userId);

    return {
      response: action.responseMessage(songTitle, artistName)
    };
  } catch (error) {
    if (
      _.includes(
        _.get(error, 'response.body'),
        'Player command failed: No active device found'
      )
    ) {
      return {
        response: responses.MUSIC.ERRORS.NO_ACTIVE_DEVICE
      };
    }
    throw error;
  }
};

module.exports = executeSpotifyAction;
