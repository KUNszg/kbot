const _ = require('lodash');

const healthcheckMiddleware = require('../lib/utils/healthcheckMiddleware');

const services = {
  rabbit: require('./services/rabbitClient'),
  redis: require('./services/redisClient'),
  sql: require('./services/sqlClient'),
  tmi: require('./services/tmiClient'),
  reddit: require('./services/redditClient'),
  discord: require('./services/discordClient'),
  websocket: require('./services/websocketClient'),
};

exports.Connector = {
  async dependencies(deps, connectionArgs) {
    if (!_.isEmpty(deps) && !_.isNil(deps)) {
      const clients = {};

      if (_.get(connectionArgs, 'enableHealthcheck')) {
        const service = _.get(connectionArgs, 'service');

        if (service) {
          healthcheckMiddleware(service);
        }
      }

      for (let dep of deps) {
        const client = _.get(this[dep], `${dep}Client`);

        await client.connect();

        clients[`${dep}Client`] = client;
      }

      return clients;
    }
  },
  ...services,
};
