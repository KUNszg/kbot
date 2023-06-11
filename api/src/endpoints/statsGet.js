const shell = require('child_process');
const fs = require('fs');

const getModuleData = require('../../utils/getModuleData');
const _ = require('lodash');

const statsGet = services => {
  const { app, kb } = services;

  app.get('/api/stats', async (req, res) => {
    const modules = await kb.query(`SELECT * FROM stats`);
    const channels = await kb.query('SELECT * FROM channels');

    const executions = await kb.query(
      'SELECT count FROM stats WHERE type="statsApi" AND sha="commandExecs"'
    );

    const usersLogged = await kb.query(
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

    const commits =
      process.platform === 'linux'
        ? _.toInteger(shell.execSync('sudo git rev-list --count master'))
        : 0;

    const lines =
      process.platform === 'linux'
        ? shell.execSync(
            `find . -name '*.js' -not -path "./node_modules*" | xargs wc -l | tail -1`
          )
        : 0;

    const uptimeData =
      process.platform === 'linux'
        ? _.toString(fs.readFileSync('../data/temp_api_uptime.txt'))
        : 0;

    const restartData =
      process.platform === 'linux'
        ? _.toString(fs.readFileSync('../data/temp_api_restarting.txt'))
        : 0;

    const isRestarting =
      0.9 * channels.length > Math.trunc(Date.now() - _.toInteger(restartData)) / 1000;

    const linesOfCode = _.toInteger(_.first(_.split(_.toString(lines), ' ')));
    const _usersLogged = _.toInteger(_.get(_.first(usersLogged), 'count'));
    const commandExecutions = _.toInteger(_.get(_.first(executions), 'count'));
    const uptime = Date.now() - Math.trunc(_.toInteger(uptimeData) * 1000);

    res.send({
      modules: {
        remindersLastSeen: getModuleData('reminders', modules),
        loggerLastSeen: getModuleData('logger', modules),
        apiLastSeen: getModuleData('api', modules),
        botLastSeen: getModuleData('bot', modules),
      },
      bot: {
        isRestarting,
        codeUptime: uptime,
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
