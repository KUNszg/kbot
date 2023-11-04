const refreshChannelList = async kb => {
  const channels = await kb.sqlClient.query('SELECT channel FROM channels');
  const channelsLogger = await kb.sqlClient.query(`SELECT channel FROM channels_logger`);

  if (!channels) {
    throw new Error("MySql connection error: query on table 'channels' returned no data");
  }

  await kb.redisClient.set(
    'kb:global:channel-list',
    channels.map(channel => channel.channel),
    1e8
  );

  await kb.redisClient.set(
    'kb:global:channel-logger-list',
    channelsLogger.map(channel => channel.channel),
    1e8
  );
};

module.exports = refreshChannelList;
