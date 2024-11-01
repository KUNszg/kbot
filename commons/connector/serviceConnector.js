const _ = require('lodash');

const healthcheckMiddleware = require('../../lib/utils/healthcheckMiddleware');
const sleep = require('./utils/sleep');

const services = {
  rabbit: require('./services/rabbitClient'),
  redis: require('./services/redisClient'),
  sql: require('./services/sqlClient'),
  tmi: require('./services/tmiClient'),
  reddit: require('./services/redditClient'),
  discord: require('./services/discordClient'),
  websocket: require('./services/websocketClient'),
};

/**
 * Singleton class for managing service connections.
 */
class ServiceConnector {
  constructor() {
    if (!ServiceConnector.instance) {
      ServiceConnector.instance = this;
      this.connectedClients = {};
    }

    return ServiceConnector.instance;
  }

  /**
   * Getter for the SQL client singleton.
   * @returns {SqlClient} The singleton instance of SqlClient.
   */
  get sqlClient() {
    return services.sql.sqlClient;
  }

  /**
   * Getter for the RabbitMQ client singleton.
   * @returns {RabbitClient} The singleton instance of RabbitClient.
   */
  get rabbitClient() {
    return services.rabbit.rabbitClient;
  }

  /**
   * Getter for the Redis client singleton.
   * @returns {RedisClient} The singleton instance of RedisClient.
   */
  get redisClient() {
    return services.redis.redisClient;
  }

  /**
   * Getter for the TMI client singleton.
   * @returns {TmiClient} The singleton instance of TmiClient.
   */
  get tmiClient() {
    return services.tmi.tmiClient;
  }

  /**
   * Getter for the Reddit client singleton.
   * @returns {RedditClient} The singleton instance of RedditClient.
   */
  get redditClient() {
    return services.reddit.redditClient;
  }

  /**
   * Getter for the Discord client singleton.
   * @returns {DiscordClient} The singleton instance of DiscordClient.
   */
  get discordClient() {
    return services.discord.discordClient;
  }

  /**
   * Getter for the WebSocket client singleton.
   * @returns {WebsocketClient} The singleton instance of WebSocketClient.
   */
  get websocketClient() {
    return services.websocket.websocketClient;
  }

  /**
   * Establishes connections to specified service dependencies.
   * @param {Array<string>} deps - The list of dependencies to connect to.
   * @param {Object} [connectionArgs] - Arguments for connection, such as enabling health checks.
   * @returns {Promise<Object>} A promise that resolves to an object containing connected clients.
   */
  async dependencies(deps, connectionArgs) {
    if (!_.isEmpty(deps) && !_.isNil(deps)) {
      const clients = {};

      if (_.get(connectionArgs, 'enableHealthcheck')) {
        const service = _.get(connectionArgs, 'service');

        if (service) {
          healthcheckMiddleware(service);
        }
      }

      const startTime = Date.now();

      deps = _.uniq(deps);

      _.pull(deps, 'tmi');
      deps.push('tmi');

      for (let dep of deps) {
        if (this.connectedClients[dep]) {
          clients[`${dep}Client`] = this.connectedClients[dep];
        } else {
          const client = _.get(this, `${dep}Client`);

          console.log(`Connecting to ${dep}`);

          if (
            dep === 'tmi' &&
            'redisClient' in clients &&
            'sqlClient' in clients &&
            'rabbitClient' in clients
          ) {
            client.setServiceConnector(clients);
          }

          await client.connect();

          this.connectedClients[dep] = client;
          clients[`${dep}Client`] = client;
        }
      }

      if (!_.every(clients, client => client.isConnected)) {
        console.error(
          `Failed to connect to ${_.size(
            _.filter(clients, client => !client.isConnected)
          )} client`
        );

        return {};
      } else {
        console.log(
          `Connected to ${_.size(deps)} clients in ${((Date.now() - startTime) / 1000).toFixed(
            2
          )}s`
        );

        return clients;
      }
    }
  }
}

module.exports = {
  Connector: new ServiceConnector(),
};
