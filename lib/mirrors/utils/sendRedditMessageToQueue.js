const _ = require('lodash');

const sendRedditMessageToQueue = kb => {
  const sendToQueue = async data => {
    const checkCache = await kb.redisClient.get(`kb:handler:reddit:livethreads:${data.id}`);

    if (!checkCache) {
      const livethreadsFromLastDay = await kb.sqlClient.query(
        'SELECT * FROM livethreads WHERE DATE > NOW() - INTERVAL 1 DAY LIMIT 100"'
      );

      let similarities = 0;
      let total = 0;

      _.forEach(livethreadsFromLastDay, livethread => {
        const splitBodyDb = _.split(JSON.parse(livethread.body), ' ');
        const splitBodyIncoming = _.split(data.body, ' ');

        total = _.max([_.size(splitBodyDb), _.size(splitBodyIncoming)]);

        _.forEach(splitBodyIncoming, word => {
          if (splitBodyDb.includes(word)) {
            similarities++;
          }
        });
      });

      const isSimilarityReached = (similarities / total) * 100 < 60;

      if (!isSimilarityReached) {
        await kb.rabbitClient.sendToQueue('KB_HANDLER_REDDIT_LIVETHREADS', data);

        await kb.redisClient.set(
          `kb:handler:reddit:livethreads:${data.id}`,
          true,
          60 * 60 * 24
        );
      }
    }
  };

  kb.redditClient.native.getLivethread('18hnzysb1elcs').stream.on('update', sendToQueue);
};

module.exports = sendRedditMessageToQueue;
