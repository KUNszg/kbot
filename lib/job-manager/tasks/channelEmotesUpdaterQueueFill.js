const channelEmotesUpdaterQueueFill = async kb => {
  const channelsToUpdate = await kb.sqlClient.query(`
      SELECT userId, channel
      FROM channels_logger
      WHERE emotesUpdate < (NOW() - INTERVAL 1 DAY)
        AND status="enabled";
  `);

  for (const channelMetaData of channelsToUpdate) {
    const cacheKey = `kb:job-manager:channelEmotesUpdaterQueueFill:queueCache:${channelMetaData.userId}`;
    const isCached = await kb.redisClient.get(cacheKey);

    if (isCached) continue;

    await kb.redisClient.set(cacheKey, { status: 'visited' }, 60 * 60 * 24 * 3);

    await kb.rabbitClient.sendToQueue(
      'KB_JOB_MANAGER_CHANNEL_TO_UPDATE_EMOTES',
      channelMetaData
    );
  }
};

module.exports = channelEmotesUpdaterQueueFill;
