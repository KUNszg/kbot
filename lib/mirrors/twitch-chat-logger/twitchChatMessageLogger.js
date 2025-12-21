const _ = require('lodash');

const serviceConnector = require('../../../commons/connector/serviceConnector');
const regex = require('../../../consts/regex.js');
const serviceSettings = require('../../../consts/serviceSettings.json');

const service = serviceSettings.services.twitchChatMessageLogger;

const channelsLoggerRedisPath = 'kb:global:channel-logger-list:detail';

(async () => {
  const kb = await serviceConnector.Connector.dependencies(
    ['sql', 'rabbit', 'redis', 'websocket'],
    {
      enableHealthcheck: true,
      service
    }
  );

  try {
    const ignoreList = await kb.sqlClient.query('SELECT userId FROM logger_ignore_list');

    let channelsLogger = await kb.redisClient.get(channelsLoggerRedisPath);

    setInterval(
      async () => {
        channelsLogger = await kb.redisClient.get(channelsLoggerRedisPath);
      },
      1000 * 60 * 10
    );

    const cache = [];
    let isProcessing = false;
    let lastProcessTime = Date.now();

    const processCache = async () => {
      if (isProcessing || cache.length === 0) return;

      isProcessing = true;
      lastProcessTime = Date.now();

      const messagesToProcess = [...cache];
      cache.length = 0;

      try {
        const groupedByChannels = _.groupBy(messagesToProcess, ({ msg }) => msg.channel);

        const allUserData = [];
        const existingUsernamesSet = new Set();

        for (const group of Object.values(groupedByChannels)) {
          const values = [];
          const data = [];
          const rawMessages = [];

          for (const item of group) {
            const {
              msg: messageContext,
              rawMsg: rawMessage,
              consumer: consumerInstance
            } = item;
            let { username, message, date, color, 'user-id': userId } = messageContext;

            values.push('(?, ?, ?)');
            data.push(username || null, message || null, date || null);
            rawMessages.push({ rawMsg: rawMessage, consumer: consumerInstance });

            const badWord = message.match(regex.racism);
            if (badWord) {
              await kb.rabbitClient.sendToQueue(
                service.queues.KB_DETECTED_BANPHRASE,
                messageContext
              );
            }

            if (!existingUsernamesSet.has(username)) {
              color = !color ? 'gray' : color;

              allUserData.push([
                username,
                userId,
                `${date}*${messageContext['channel']}*${message}`,
                color,
                date
              ]);

              existingUsernamesSet.add(username);
            }
          }

          const groupChannel = _.get(group, '0.msg.channel');

          if (values.length > 0 && !!groupChannel) {
            const valuesString = values.join(', ');

            try {
              await kb.sqlClient.query(
                `INSERT IGNORE INTO logs_${groupChannel} (username, message, date) VALUES ${valuesString}`,
                data
              );
            } catch (err) {
              if (err.code !== 'ER_NO_SUCH_TABLE') {
                console.error(
                  `[twitchChatMessageLogger] Error inserting to logs_${groupChannel}:`,
                  err
                );
              }
            }

            for (const { rawMsg, consumer } of rawMessages) {
              await consumer.ack(rawMsg);
            }
          }
        }

        if (allUserData.length > 0) {
          const userValues = allUserData.map(() => '(?, ?, ?, ?, ?)').join(', ');

          await kb.sqlClient.query(
            `INSERT IGNORE INTO user_list (username, userId, firstSeen, color, added)
             VALUES ${userValues}`,
            allUserData.flat()
          );

          const updatePromises = allUserData.map(([username, userId, firstSeen]) =>
            kb.sqlClient.query(
              `UPDATE user_list SET lastSeen=CONCAT(?, '*update') WHERE username=?`,
              [firstSeen, username]
            )
          );

          await Promise.all(updatePromises);

          kb.websocketClient.websocketEmitter.emit('/wsl', {
            type: 'usersTotal',
            data: allUserData.length
          });
        }
      } catch (error) {
        console.error('[twitchChatMessageLogger] Processing error:', error);
      } finally {
        isProcessing = false;
      }
    };

    setInterval(async () => {
      if (cache.length > 0 && Date.now() - lastProcessTime > 2000) {
        processCache().catch(err => console.error('[processCache interval]', err));
      }
    }, 1000);

    await kb.rabbitClient.createRabbitChannel(
      service.queues.KB_TWITCH_CHAT_MESSAGES,
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

        cache.push({ msg, rawMsg, consumer });

        if (cache.length >= 25 && !isProcessing) {
          processCache().catch(err => console.error('[processCache trigger]', err));
        }
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
