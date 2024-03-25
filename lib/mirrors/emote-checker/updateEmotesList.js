const got = require('got');
const _ = require('lodash');
const moment = require('moment');

const serviceConnector = require('../../../connector/serviceConnector');
const serviceSettings = require('../../../consts/serviceSettings.json');

const seventvEmoteCheck = require('./utils/seventvEmoteCheck');
const bttvEmoteCheck = require('./utils/bttvEmoteCheck');
const ffzEmoteCheck = require('./utils/ffzEmoteCheck');
const getEmoteDate = require('./utils/getEmoteDate');
const getEmoteId = require('./utils/getEmoteId');

const service = serviceSettings.services.updateEmotesList;

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['sql', 'rabbit'], {
    enableHealthcheck: true,
    service,
  });

  await kb.rabbitClient.createRabbitChannel(
    service.queues.KB_TASK_MANAGER_CHANNEL_TO_UPDATE_EMOTES,
    async (msg, consumer, msgRaw) => {
      const userId = _.get(msg, 'userId');
      const channel = _.get(msg, 'channel');

      if (!userId || !channel) {
        console.error({
          message: 'invalid message - no userId',
          source: 'updateEmotesList',
          timestamp: new Date(),
        });

        await consumer.ack(msgRaw);

        return null;
      }

      const emotePlatforms = await Promise.allSettled([
        seventvEmoteCheck(userId),
        bttvEmoteCheck(userId),
        ffzEmoteCheck(userId),
      ]);

      let emotesToAdd = [];
      let emotesToRemove = [];

      for (const emotes of emotePlatforms) {
        const emoteSet = _.get(emotes, 'value');
        const type = _.get(emoteSet, '0.type');

        if (_.size(emoteSet)) {
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
            sevenTvId,
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
            emote.sevenTvId,
          ]
        );

        await kb.sqlClient.query(
          `
          DELETE FROM emotes
          WHERE id=?
            AND userId=?,
        `,
          [emote.ID, emote.userId]
        );
      }
    },
    { prefetchCount: 5 }
  );
})();
