const _ = require('lodash');
const moment = require('moment');

const updateUsageStats = async kb => {
  const userCount = await kb.sqlClient.query('SELECT COUNT(*) as count FROM user_list');
  const commandsCount = await kb.sqlClient.query('SELECT COUNT(*) as count FROM executions');

  const dateNow = moment().format('YYYY-MM-DD HH:mm:ss');

  await kb.sqlClient.query(`
        UPDATE stats
        SET count="${commandsCount[0].count}",
            date="${dateNow}"
        WHERE type="statsApi" AND sha="commandExecs"`);

  await kb.sqlClient.query(`
        UPDATE stats
        SET count="${userCount[0].count}",
            date="${dateNow}"
        WHERE type="statsApi" AND sha="totalUsers"`);

  let userLoggedInCount = await kb.sqlClient.query(`
        SELECT COUNT(*) AS count
        FROM access_token
        WHERE platform="spotify" OR platform="lastfm" AND user IS NOT NULL`);

  let commandExecutionsCount = await kb.sqlClient.query(`
        SELECT COUNT(*) AS count
        FROM executions
        WHERE command LIKE "%spotify%"`);

  [commandExecutionsCount, userLoggedInCount] = [
    _.get(commandExecutionsCount, '0.count'),
    _.get(userLoggedInCount, '0.count'),
  ];

  if (commandExecutionsCount && userLoggedInCount) {
    await kb.redisClient
      .multi()
      .set(
        'kb:api:website-pages:command-executions-count',
        JSON.stringify(commandExecutionsCount)
      )
      .set(
        'kb:api:website-pages:spotify-and-lastfm-user-logged-in-count',
        JSON.stringify(userLoggedInCount)
      )
      .exec();
  }

  kb.websocketClient.emitter.emit('wsl', {
    type: 'updateCache',
    data: true,
  });
};

module.exports = updateUsageStats;
