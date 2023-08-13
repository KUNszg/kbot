const _ = require('lodash');

const services = {
  rabbitClient: require('./services/rabbitClient'),
  redisClient: require('./services/redisClient'),
  sqlClient: require('./services/sqlClient'),
  tmiClient: require('./services/tmiClient'),
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
  sql: services.sqlClient,
  rabbit: services.rabbitClient,
  redis: services.redisClient,
  tmi: services.tmiClient,
};
