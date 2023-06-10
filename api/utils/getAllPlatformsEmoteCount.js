const _ = require('lodash');

const getAllPlatformsEmoteCount = (emotesAdded, platform) => {
  return _.filter(emotesAdded, emote => emote.type === platform).length;
};

module.exports = getAllPlatformsEmoteCount;
