const _ = require('lodash');

const channelEmotesUpdaterQueueFill = async kb => {
  const channelsToUpdate = await kb.sqlClient.query(`
    SELECT channel, userId
    FROM channels_logger
    WHERE emotesUpdate < (NOW() - INTERVAL 1 DAY)
        AND status="enabled";
  `);

  _.map(channelsToUpdate, async channelMetaData => {
    await kb.rabbitClient.sendToQueue("KB_TASK_MANAGER_CHANNEL_TO_UPDATE_EMOTES", channelMetaData);
  });
};

module.exports = channelEmotesUpdaterQueueFill;