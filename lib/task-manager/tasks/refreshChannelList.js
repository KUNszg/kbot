const refreshChannelList = async kb => {
  const channels = await kb.query('SELECT * FROM channels');

  if (!channels) {
    throw new Error("MySql connection error: query on table 'channels' returned no data");
  }

  await kb.redisClient.set(
    'kb:global:channel-list',
    channels.map(channel => channel.channel),
    1e8
  );
};

module.exports = refreshChannelList;
