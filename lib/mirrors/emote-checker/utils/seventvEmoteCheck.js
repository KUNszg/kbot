const got = require('got');
const _ = require('lodash');

const seventvEmoteCheck = async userId => {
  let result = null;

  try {
    result = await got({
      method: 'GET',
      url: `https://7tv.io/v3/users/twitch/${userId}`,
    }).json();
  } catch (err) {
    console.error({
      message: 'Error while fetching 7tv emotes for channel',
      userId,
      timestamp: new Date(),
    });
  }

  const emotes = _.get(result, 'emote_set.emotes');

  return _.map(emotes, (emote = {}) => {
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
  });
};

module.exports = seventvEmoteCheck;
