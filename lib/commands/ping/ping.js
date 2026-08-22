const _ = require('lodash');

const ping = async ({ startTime }, { kb, Commons }) => {
  const responses = Commons.ResponseRepository().getResponses();

  const storedUptime = await _.get(kb, 'redisClient').get('kb:command-manager:botUptime');
  const uptimeMs = _.defaultTo(storedUptime, process.uptime());
  const uptimeFormatted = Commons.UtilityRepository().humanizeDuration(uptimeMs);

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const processTimeMs = _.round(seconds * 1000 + nanoseconds / 1000000, 2);

  return {
    response: responses.PING.SUCCESS.PONG(`${uptimeFormatted} | latency: ${processTimeMs}ms`)
  };
};

module.exports.invocation = ping;
