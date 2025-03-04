const ping = async ({ }, { kb, Commons }) => {
  const uptimeMs = (await kb.redisClient.get('kb:command-manager:botUptime')) || process.uptime();

  return {
    response: `pong! Running for ${Commons.UtilityRepository(kb).humanizeDuration(uptimeMs)}, project website: https://kunszg.com`,
  };
};

module.exports.invocation = ping;