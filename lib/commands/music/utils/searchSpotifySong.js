const _ = require('lodash');

const searchSpotifySong = async (spotifyFetchWithOauth, message, userId, Commons) => {
  const responses = Commons.ResponseRepository().getResponses();

  const searchResult = await spotifyFetchWithOauth(
    'GET',
    `/v1/search?q=${_.join(message, '%20')}&type=track&limit=1`,
    {
      userId,
      isSender: true
    }
  );

  if (!_.get(searchResult, 'spotifyUser.isPremium')) {
    return {
      error: true,
      response: responses.MUSIC.ERRORS.NO_PREMIUM
    };
  }

  const spotifySearchEndpointResponse = _.get(searchResult, 'endpointResponse');

  if (!_.size(_.get(spotifySearchEndpointResponse, 'tracks.items'))) {
    return {
      error: true,
      response: responses.MUSIC.ERRORS.NO_TRACKS_FOUND
    };
  }

  return searchResult;
};

module.exports = searchSpotifySong;
