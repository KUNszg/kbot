const ping = async ({}, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();
  const uptimeMs =
    (await kb.redisClient.get('kb:command-manager:botUptime')) || process.uptime();
  const uptimeFormatted = Commons.UtilityRepository().humanizeDuration(uptimeMs);

  return {
    response: responses.PING.SUCCESS.PONG(uptimeFormatted)
  };
};

module.exports.invocation = ping;
