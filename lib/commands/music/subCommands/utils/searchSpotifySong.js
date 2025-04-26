const _ = require('lodash');

const searchSpotifySong = async (spotifyFetchWithOauth, message, userId) => {
  const searchResult = await spotifyFetchWithOauth(
    'GET',
    `/v1/search?q=${_.join(message, '%20')}&type=track&limit=1`,
    userId,
    true
  );

  if (!_.get(searchResult, 'spotifyUser.isPremium')) {
    return {
      error: true,
      response: 'you need to be subscribed to Spotify premium to use this command.'
    };
  }

  const spotifySearchEndpointResponse = _.get(searchResult, 'endpointResponse');

  if (!_.size(_.get(spotifySearchEndpointResponse, 'tracks.items'))) {
    return {
      error: true,
      response: 'no tracks were found with given query.'
    };
  }

  return searchResult;
};

module.exports = searchSpotifySong;
