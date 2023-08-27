const _ = require('lodash');

const services = {
  rabbit: require('./services/rabbitClient'),
  redis: require('./services/redisClient'),
  sql: require('./services/sqlClient'),
  tmi: require('./services/tmiClient'),
  reddit: require('./services/redditClient'),
  discord: require('./services/discordClient'),
};

exports.Connector = {
  async dependencies(deps, connectionArgs) {
    if (!_.isEmpty(deps) && !_.isNil(deps)) {
      const clients = {};

      for (let dep of deps) {
        const client = _.get(this[dep], `${dep}Client`);

        if (connectionArgs) {
          await client.connect(connectionArgs);
        } else {
          await client.connect();
        }

        clients[`${dep}Client`] = client;
      }

      return clients;
    }
  },
  ...services
};
