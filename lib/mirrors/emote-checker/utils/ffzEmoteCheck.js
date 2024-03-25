const got = require('got');
const _ = require('lodash');

const ffzEmoteCheck = async userId => {
  let result = null;

  try {
    result = await got({
      method: 'GET',
      url: `https://api.frankerfacez.com/v1/room/id/${userId}`,
    }).json();
  } catch (err) {
    console.error({
      message: 'Error while fetching ffz emotes for channel',
      userId,
      timestamp: new Date(),
    });
  }

  const set = _.get(result, 'room.set');
  const emotes = _.get(result, `sets.${set}.emoticons`);

  return _.map(emotes, (emote = {}) => {
    const name = _.get(emote, 'name');
    const id = _.get(emote, 'id');

    if (!!name && !!id) {
      return {
        type: 'ffz',
        name,
        id,
        timestamp: null,
        emotePicture: `https://cdn.frankerfacez.com/emote/${id}/1`,
      };
    }
  });
};

module.exports = ffzEmoteCheck;
