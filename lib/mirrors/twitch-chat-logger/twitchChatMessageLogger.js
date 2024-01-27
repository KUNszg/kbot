const _ = require('lodash');

const serviceConnector = require('../../../connector/serviceConnector');
const regex = require('../../../lib/utils/regex.js');

const channelsLoggerRedisPath = 'kb:global:channel-logger-list:detail';

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit', 'redis']);

  try {
    const ignoreList = await kb.sqlClient.query('SELECT userId FROM logger_ignore_list');

    let channelsLogger = await kb.redisClient.get(channelsLoggerRedisPath);

    setInterval(async () => {
      channelsLogger = await kb.redisClient.get(channelsLoggerRedisPath);
    }, 1000 * 60 * 10);

    const cache = [];

    await kb.rabbitClient.createRabbitChannel(
      'KB_TWITCH_CHAT_MESSAGES',
      async (msg, consumer, rawMsg) => {
        const channel = _.find(
          channelsLogger,
          i => i.channel === _.replace(msg.channel, '#', _.stubString())
        );

        if (_.get(channel, 'status') === 'disabled') {
          await consumer.ack(rawMsg);
          return;
        }

        const filteredMessage = _.replace(msg.message, regex.invisChar, '');

        if (_.isNil(filteredMessage) || _.isEmpty(filteredMessage)) {
          await consumer.ack(rawMsg);
          return;
        }

        const filterBots = _.find(ignoreList, i => i.userId === msg['user-id']);

        if (!!filterBots) {
          await consumer.ack(rawMsg);
          return;
        }

        msg.message = filteredMessage;

        cache.push(msg);

        if (_.size(cache) > 200) {
          for (const messageContext of cache) {
            await kb.sqlClient.query(
              `
                    UPDATE IGNORE user_list
                    SET lastSeen=?
                    WHERE username=?`,
              [
                `${messageContext['date']}*${messageContext['channel']}*${messageContext['message']}`,
                messageContext['username'],
              ]
            );
          }

          const groupedByChannels = _.groupBy(cache, ({ channel }) => channel);

          for (const group of groupedByChannels) {
            let values = _.stubString();
            const data = [];

            for (const messageContext of group) {
              let { username, message, date, color, 'user-id': userId } = messageContext;

              values += 'VALUES(?, ?, ?), ';
              data.push(username || null, message || null, date || null);

              const badWord = message.match(regex.racism);
              if (badWord) {
                await kb.rabbitClient.sendToQueue('KB_DETECTED_BANPHRASE', messageContext);
              }

              const checkIfUnique = await kb.sqlClient.query(
                `
                  SELECT *
                  FROM user_list
                  WHERE username=?`,
                [username]
              );

              if (!checkIfUnique.length) {
                kb.websocketClient.websocketEmitter.emit('/wsl', {
                  type: 'usersTotal',
                  data: 1,
                });

                color = !color ? 'gray' : color;

                await kb.sqlClient.query(
                  `
                        INSERT IGNORE INTO user_list (username, userId, firstSeen, lastSeen, color, added)
                        VALUES (?, ?, ?, ?, ?, ?)`,
                  [username, userId, channel, `${date}*${channel}*${message}`, color, date]
                );
              }
            }

            const groupChannel = _.get(group, '0.channel');

            if (!!values && !!groupChannel) {
              values = values.slice(0, -1);

              await kb.sqlClient.query(
                `
                    INSERT INTO logs_${groupChannel} (username, message, date)
                    ${values}`,
                data
              );
            }
          }
        }

        await consumer.ack(rawMsg);
      },
      {
        prefetchCount: 25
      }
    );
  } catch (err) {
    console.error(err);
  }

  setInterval(async () => {
    await kb.sqlClient.query("DELETE FROM user_list WHERE username IS null OR username = ''");
  }, 1_800_000);
})();

// TODO: healthcheck with expressjs

// const statusCheck = async () => {
//   await kb.sqlClient.query(
//     `
//                 UPDATE stats
//                 SET date=?
//                 WHERE type="module" AND sha="logger"`,
//     [new Date().toISOString().slice(0, 19).replace('T', ' ')]
//   );
// };
// statusCheck();
// setInterval(() => {
//   statusCheck();
// }, 60000);

