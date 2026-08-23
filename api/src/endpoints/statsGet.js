const _ = require('lodash');
const got = require('got');

const creds = require('../../../lib/credentials/config');

const getModuleData = require('../../utils/getModuleData');

const statsGet = services => {
  const { app, Commons } = services;

  const kb = Commons.ServiceConnector.Connector;

  app.get('/api/stats', async (req, res) => {
    const modules = (await kb.redisClient.get(`kb:global:stats`)) || [];
    const channels = (await kb.redisClient.get('kb:global:channel-list')) || [];
    const lines = (await kb.redisClient.get('kb:job-manager:estimatedRepoLines')) || 0;
    const botStartedAt = await kb.redisClient.get('kb:command-manager:botStartedAt');

    const executions = await kb.sqlClient.query(
      'SELECT count FROM stats WHERE type="statsApi" AND sha="commandExecs"'
    );

    const usersLogged = await kb.sqlClient.query(
      'SELECT count FROM stats WHERE type="statsApi" AND sha="totalUsers"'
    );

    const totalViewCount = _.reduce(
      _.map(
        _.filter(channels, i => _.toInteger(i.viewerCount) > 0),
        i => _.toInteger(i.viewerCount)
      ),
      (x, y) => {
        return x + y;
      },
      0
    );

    const githubResponse = await got(
      {
        url: 'https://api.github.com/repos/kunszg/kbot/commits?per_page=1&page=1',
        headers: {
          Authorization: process.env.githubAppAccessToken || creds.githubAppAccessToken,
        },
      }
    ).json();

    const commits =
      _.toNumber(
        _.last(_.split(_.get(githubResponse, 'headers.link'), '&')).replace(/[^0-9]/g, '')
      ) || 0;

    const linesOfCode = _.toInteger(_.get(_.split(_.toString(lines), ' '), '1'));
    const _usersLogged = _.toInteger(_.get(_.first(usersLogged), 'count'));
    const commandExecutions = _.toInteger(_.get(_.first(executions), 'count'));

    res.send({
      modules: {
        remindersLastSeen: getModuleData('reminders', modules),
        loggerLastSeen: getModuleData('logger', modules),
        apiLastSeen: getModuleData('api', modules),
        botLastSeen: getModuleData('bot', modules),
      },
      bot: {
        isRestarting: false,
        codeUptime: botStartedAt
          ? Date.now() - _.toInteger(botStartedAt)
          : Math.trunc(process.uptime() * 1000),
        linesOfCode,
        usersLogged: _usersLogged,
        commandExecutions,
      },
      github: {
        commits,
      },
      twitch: {
        totalViewCount,
      },
    });
  });
};

module.exports = statsGet;
