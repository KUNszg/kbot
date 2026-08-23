const _ = require('lodash');

const serviceConnector = require('../../../commons/connector/serviceConnector');
const { startHeartbeat } = require('../../../commons/connector/utils/heartbeat');
const serviceSettings = require('../../../consts/serviceSettings.json');

const seventvEmoteCheck = require('./utils/seventvEmoteCheck');
const bttvEmoteCheck = require('./utils/bttvEmoteCheck');
const ffzEmoteCheck = require('./utils/ffzEmoteCheck');
const getEmoteDate = require('./utils/getEmoteDate');
const getEmoteId = require('./utils/getEmoteId');

const service = serviceSettings.services.updateEmotesList;

const PLATFORM_CHECKS = [
  { type: '7tv', check: seventvEmoteCheck },
  { type: 'bttv', check: bttvEmoteCheck },
  { type: 'ffz', check: ffzEmoteCheck }
];

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit', 'redis'], {
    enableHealthcheck: true,
    service
  });

  startHeartbeat(kb, 'update-emotes-list');

  await kb.rabbitClient.createRabbitChannel(
    service.queues.KB_JOB_MANAGER_CHANNEL_TO_UPDATE_EMOTES,
    async (msg, consumer, msgRaw) => {
      const userId = _.get(msg, 'userId');
      const channel = _.get(msg, 'channel');

      if (!userId || !channel) {
        console.error({
          message: 'invalid message - no userId',
          source: 'updateEmotesList',
          timestamp: new Date()
        });

        await consumer.ack(msgRaw);

        return null;
      }

      const emotePlatforms = await Promise.allSettled(
        PLATFORM_CHECKS.map(({ check }) => check(userId))
      );

      let emotesToAdd = [];
      let emotesToRemove = [];
      let hasFailedPlatform = false;

      for (let i = 0; i < emotePlatforms.length; i++) {
        const result = emotePlatforms[i];
        const { type } = PLATFORM_CHECKS[i];

        if (result.status === 'rejected') {
          console.error({
            message: `Failed to fetch ${type} emotes, skipping this platform for this cycle`,
            userId,
            channel,
            reason: _.get(result, 'reason.message', result.reason),
            timestamp: new Date()
          });
          hasFailedPlatform = true;
          continue;
        }

        const emoteSet = result.value;

        const activeEmotes = await kb.sqlClient.query(
          `
              SELECT *
              FROM emotes
              WHERE userId=? AND type=?
            `,
          [userId, type]
        );

        const activeEmotesNames = _.map(activeEmotes, emote => emote.emote);
        const fetchedEmotesNames = _.map(emoteSet, emote => emote.name);

        emotesToAdd.push(
          ..._.filter(emoteSet, emote => !_.includes(activeEmotesNames, emote.name))
        );

        emotesToRemove.push(
          ..._.filter(activeEmotes, emote => !_.includes(fetchedEmotesNames, emote.emote))
        );
      }

      for (const emote of emotesToAdd) {
        const emoteInsertDate = getEmoteDate(emote.timestamp);
        const { emoteId, sevenTvId } = getEmoteId(emote.id, emote.type);

        await kb.sqlClient.query(
          `
          INSERT INTO emotes (userId, channel, emote, type, date, url, emoteId, sevenTvId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            userId,
            channel,
            emote.name,
            emote.type,
            emoteInsertDate,
            emote.emotePicture,
            emoteId,
            sevenTvId
          ]
        );
      }

      for (const emote of emotesToRemove) {
        await kb.sqlClient.query(
          `
          INSERT INTO emotes_removed (userId, channel, emote, type, date, url, emoteId, sevenTvId)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
          `,
          [
            emote.userId,
            emote.channel,
            emote.emote,
            emote.type,
            emote.url,
            emote.emoteId,
            emote.sevenTvId
          ]
        );

        await kb.sqlClient.query(
          `
          DELETE FROM emotes
          WHERE id=?
            AND userId=?
          `,
          [emote.ID, emote.userId]
        );
      }

      const cacheKey = `kb:job-manager:channelEmotesUpdaterQueueFill:queueCache:${userId}`;

      if (!hasFailedPlatform) {
        await kb.sqlClient.query(
          `
          UPDATE channels_logger
          SET emotesUpdate = CURRENT_TIMESTAMP
          WHERE userId=?
          `,
          [userId]
        );

        await kb.redisClient.set(cacheKey, true, 60 * 60 * 24);
      } else {
        // channelEmotesUpdaterQueueFill already set this key (3-day TTL) before enqueueing
        // this message. Clear it so the channel is immediately eligible for re-enqueue
        // instead of being blocked from a retry for up to 3 days.
        await kb.redisClient.del(cacheKey);
      }

      await consumer.ack(msgRaw);
    },
    { prefetchCount: 5 }
  );
})();
