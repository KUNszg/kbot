const got = require('got');
const _ = require('lodash');

const bttvEmoteCheck = async userId => {
  let result = null;

  try {
    result = await got({
      method: 'GET',
      url: `https://api.betterttv.net/3/cached/users/twitch/${userId}`,
    }).json();
  } catch (err) {
    console.error({
      message: 'Error while fetching bttv emotes for channel',
      userId,
      timestamp: new Date(),
    });
  }

  const emotes = _.concat(
    _.get(result, 'sharedEmotes', []),
    _.get(result, 'channelEmotes', [])
  );

  return _.map(emotes, (emote = {}) => {
    const name = _.get(emote, 'code');
    const id = _.get(emote, 'id');

    if (!!name && !!id) {
      return {
        type: 'bttv',
        name,
        id,
        timestamp: null,
        emotePicture: `https://cdn.betterttv.net/emote/${id}/1x`,
      };
    }
  });
};

module.exports = bttvEmoteCheck;
