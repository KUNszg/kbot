const got = require('got');
const _ = require('lodash');

const SEVENTV_USER_NOT_FOUND_ERROR_CODE = 12000;

const seventvEmoteCheck = async userId => {
  let result;

  try {
    result = await got({
      method: 'GET',
      url: `https://7tv.io/v3/users/twitch/${userId}`,
    }).json();
  } catch (error) {
    const body = _.get(error, 'response.body');
    const parsedBody = typeof body === 'string' ? _.attempt(JSON.parse, body) : body;

    const isUserNotFound =
      _.get(error, 'response.statusCode') === 404 &&
      _.get(parsedBody, 'error_code') === SEVENTV_USER_NOT_FOUND_ERROR_CODE;

    if (isUserNotFound) {
      return [];
    }

    throw error;
  }

  const emotes = _.get(result, 'emote_set.emotes');

  return _.compact(
    _.map(emotes, (emote = {}) => {
      const name = _.get(emote, 'name');
      const id = _.get(emote, 'id');
      const timestamp = _.get(emote, 'timestamp') || null;

      if (!!name && !!id) {
        return {
          type: '7tv',
          name,
          id,
          timestamp,
          emotePicture: `https://cdn.7tv.app/emote/${id}/1x.webp`,
        };
      }
    })
  );
};

module.exports = seventvEmoteCheck;
