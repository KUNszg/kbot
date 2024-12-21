const refreshViewCount = async kb => {
  const channelsViewCount = await kb.sqlClient.query(
    'SELECT viewerCount FROM channels WHERE viewerCount > 0'
  );

  if (!channelsViewCount) {
    throw new Error("MySql connection error: query on table 'channels' returned no data");
  }

  if (channelsViewCount.length) {
    let totalViewCount = channelsViewCount.map(i => Number(i.viewerCount));

    totalViewCount = totalViewCount.reduce((accumulator, curr) => accumulator + curr);

    kb.websocketClient.websocketEmitter.emit('wsl', {
      type: 'totalViewCount',
      data: totalViewCount,
    });
  }
};

module.exports = refreshViewCount;
