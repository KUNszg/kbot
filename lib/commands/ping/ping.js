const _ = require('lodash');

const ping = async ({ startTime }, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  const botStartedAt = await _.get(kb, 'redisClient').get('kb:command-manager:botStartedAt');
  const uptimeSeconds = botStartedAt
    ? (Date.now() - _.toInteger(botStartedAt)) / 1000
    : process.uptime();
  const uptimeFormatted = Commons.UtilityRepository().humanizeDuration(uptimeSeconds);

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const processTimeMs = _.round(seconds * 1000 + nanoseconds / 1000000, 2);

  return {
    response: responses.PING.SUCCESS.PONG(`${uptimeFormatted} | latency: ${processTimeMs}ms`)
  };
};

module.exports.invocation = ping;
