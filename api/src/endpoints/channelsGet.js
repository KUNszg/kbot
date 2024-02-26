const _ = require('lodash');
const shell = require('child_process');

const userGet = services => {
  const { app, kb } = services;

  app.get('/api/channels', async (req, res) => {
    const details = _.get(req, 'query.details');

    if (details === 'true') {
      let channels, logs;

      if (!_.get(req, 'query.channel')) {
        channels = await kb.redisClient.get('kb:global:channel-list');
        logs = await kb.redisClient.get('kb:global:channel-logger-list');
      } else {
        channels = await kb.sqlClient.query(
          `
                SELECT *
                FROM channels
                WHERE channel=?`,
          [req.query.channel]
        );

        logs = await kb.sqlClient.query(
          `
                SELECT *
                FROM channels_logger
                WHERE channel=?`,
          [req.query.channel]
        );

        if (!channels.length) {
          res.send({ error: 'Channel not found', code: 404 });
          res.status(404);
          return;
        }
      }

      const executions = await kb.sqlClient.query(`
            SELECT channel, COUNT(*) AS count
            FROM executions
            GROUP BY channel
            ORDER BY count
            DESC`);

      const banphraseApis = await kb.sqlClient.query('SELECT * FROM channel_banphrase_apis');

      const result = {};

      for (let i = 0; i < channels.length; i++) {
        const _channel = channels[i].channel;

        const findExecutions = executions.find(i => i.channel === _channel);
        const executionsCount = findExecutions ? Number(findExecutions.count) : 0;

        const findLoggedChannel = logs.find(i => i.channel === _channel);
        const isLogging = findLoggedChannel ? findLoggedChannel.status === 'enabled' : false;

        const timestampBot = new Date(channels[i].added).getTime();
        const timestampLogger = findLoggedChannel
          ? new Date(findLoggedChannel.added).getTime()
          : null;

        const findBanphraseChannels = banphraseApis.find(i => i.channel === _channel);
        const isBanphraseApiActive = findBanphraseChannels
          ? findBanphraseChannels.status === 'enabled'
          : false;
        const banphraseApi = isBanphraseApiActive ? findBanphraseChannels.url : null;

        let tableSize = 0;

        if (process.platform !== 'win32') {
          tableSize = findLoggedChannel
            ? shell
                .execSync(
                  `sudo du --apparent-size --block=M -s /var/lib/mysql/kbot/logs_${_channel}.ibd`
                )
                .toString()
                .split('/')[0]
                .replace('M', '')
            : null;
        }

        Object.defineProperties(result, {
          [_channel]: {
            value: {
              id: Number(channels[i].ID),
              userId: Number(channels[i].userId),
              name: _channel,
              liveStatus: channels[i].status,
              isStrict: channels[i].strict === 'Y',
              created: new Date(timestampBot).toISOString(),
              createdTimestamp: Number(timestampBot),
              commandsUsed: executionsCount,
              isBanphraseApiActive: isBanphraseApiActive,
              banphraseApi: banphraseApi,
              logger: {
                id: findLoggedChannel ? findLoggedChannel.ID : null,
                isLogging: isLogging,
                created:
                  timestampLogger === null ? null : new Date(timestampLogger).toISOString(),
                createdTimestamp: timestampLogger === null ? null : Number(timestampLogger),
                tableSize: Number(tableSize),
              },
            },
            writable: true,
            enumerable: true,
            configurable: true,
          },
        });
      }

      res.send({
        code: 200,
        count: channels.length,
        channels: result,
      });
    } else {
      let channelList = await kb.sqlClient.query('SELECT * FROM channels');

      channelList = channelList.map(i => i.channel);

      res.send({
        data: channelList,
      });
    }
  });
};

module.exports = userGet;
