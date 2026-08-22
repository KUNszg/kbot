const _ = require('lodash');

const handleSpotifyError = (error, username, Commons) => {
  const responses = Commons.ResponseRepository().getResponses();

  if (error.message === 'Spotify Oauth token not found') {
    return { response: responses.COMMON.ERRORS.NOT_REGISTERED(username) };
  }

  if (error.message === 'Spotify Oauth token could not be refreshed') {
    return { response: responses.MUSIC.ERRORS.TOKEN_REFRESH_FAILED };
  }

  if (error.message === 'Spotify lookup not allowed') {
    return { response: responses.MUSIC.ERRORS.LOOKUP_NOT_ALLOWED };
  }

  if (
    _.includes(_.get(error, 'response.body'), 'Player command failed: No active device found')
  ) {
    return { response: responses.MUSIC.ERRORS.NO_ACTIVE_DEVICE };
  }

  throw error;
};

module.exports = handleSpotifyError;
