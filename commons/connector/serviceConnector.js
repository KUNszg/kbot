const _ = require('lodash');

const healthcheckMiddleware = require('./services/healthcheckMiddleware');

const services = {
  rabbit: require('./services/rabbitClient'),
  redis: require('./services/redisClient'),
  sql: require('./services/sqlClient'),
  tmi: require('./services/tmiClient'),
  reddit: require('./services/redditClient'),
  discord: require('./services/discordClient'),
  websocket: require('./services/websocketClient')
};

class ServiceConnector {
  constructor() {
    if (!ServiceConnector.instance) {
      ServiceConnector.instance = this;
      this.connectedClients = {};
      this.customConfigs = {};
      this.shutdownInitiated = false;

      this._setupShutdownHandlers();
    }

    return ServiceConnector.instance;
  }

  _setupShutdownHandlers() {
    const gracefulShutdown = async signal => {
      if (this.shutdownInitiated) {
        console.log(`[Connector] ${signal} received again, forcing exit...`);
        process.exit(1);
      }

      this.shutdownInitiated = true;
      console.log(`[Connector] ${signal} received, initiating graceful shutdown...`);

      try {
        await this.closeAllConnections();
        console.log('[Connector] All connections closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('[Connector] Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', error => {
      console.error('[Connector] Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Connector] Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async closeAllConnections() {
    const closePromises = [];

    for (const [serviceName, client] of Object.entries(this.connectedClients)) {
      if (client && typeof client.close === 'function') {
        console.log(`[Connector] Closing ${serviceName} connection...`);
        closePromises.push(
          client.close().catch(error => {
            console.error(`[Connector] Error closing ${serviceName}:`, error);
          })
        );
      }
    }

    await Promise.all(closePromises);
    this.connectedClients = {};
  }

  setCustomSqlConfig(customSqlConfig) {
    this.customConfigs.sql = customSqlConfig;

    if (this.connectedClients.sql) {
      delete this.connectedClients.sql;
    }
  }

  setTMIConfig(tmiConfig) {
    this.customConfigs.tmi = tmiConfig;

    if (this.connectedClients.tmi) {
      delete this.connectedClients.tmi;
    }
  }

  get sqlClient() {
    if (this.customConfigs.sql) {
      const { SqlClient } = services.sql;
      return SqlClient.withCustomConfig(this.customConfigs.sql);
    }
    return services.sql.sqlClient;
  }

  get rabbitClient() {
    return services.rabbit.rabbitClient;
  }

  get redisClient() {
    return services.redis.redisClient;
  }

  get tmiClient() {
    return services.tmi.tmiClient;
  }

  get redditClient() {
    return services.reddit.redditClient;
  }

  get discordClient() {
    return services.discord.discordClient;
  }

  get websocketClient() {
    return services.websocket.websocketClient;
  }

  async getHealthStatus() {
    const healthStatus = {};

    for (const [serviceName, client] of Object.entries(this.connectedClients)) {
      try {
        if (typeof client.isHealthy === 'function') {
          healthStatus[serviceName] = await client.isHealthy();
        } else if (typeof client.isConnected !== 'undefined') {
          healthStatus[serviceName] = client.isConnected;
        } else {
          healthStatus[serviceName] = 'unknown';
        }
      } catch (error) {
        healthStatus[serviceName] = false;
        console.warn(`[Connector] Health check failed for ${serviceName}:`, error.message);
      }
    }

    return healthStatus;
  }

  async dependencies(deps, connectionArgs) {
    if (this.shutdownInitiated) {
      throw new Error('Cannot establish new connections during shutdown');
    }

    if (!_.isEmpty(deps) && !_.isNil(deps)) {
      const clients = {};

      if (_.get(connectionArgs, 'customSqlConfig')) {
        this.setCustomSqlConfig(connectionArgs.customSqlConfig);
      }

      if (_.get(connectionArgs, 'disableTMIAutojoin')) {
        this.setTMIConfig({ disableTMIAutojoin: true });
      }

      if (_.get(connectionArgs, 'enableHealthcheck')) {
        const service = _.get(connectionArgs, 'service');

        if (service) {
          healthcheckMiddleware(service);
        }
      }

      const startTime = Date.now();

      deps = _.uniq(deps);

      if (_.includes(deps, 'tmi')) {
        _.pull(deps, 'tmi');
        deps.push('tmi');
      }

      for (let dep of deps) {
        try {
          const needsNewConnection = dep === 'sql' && this.customConfigs.sql;

          if (this.connectedClients[dep] && !needsNewConnection) {
            clients[`${dep}Client`] = this.connectedClients[dep];
          } else {
            const client = _.get(this, `${dep}Client`);

            console.log(
              `[Connector] Connecting to ${dep}${this.customConfigs[dep] ? ' (custom config)' : ''}`
            );

            if (
              dep === 'tmi' &&
              'redisClient' in clients &&
              'sqlClient' in clients &&
              'rabbitClient' in clients
            ) {
              client.setServiceConnector(clients);

              if (this.customConfigs.tmi) {
                client.setTMIConfig(this.customConfigs.tmi);
              }
            }

            await client.connect();

            this.connectedClients[dep] = client;
            clients[`${dep}Client`] = client;
          }
        } catch (error) {
          console.error(`[Connector] Failed to connect to ${dep}:`, error.message);

          await this.closeAllConnections();
          return {};
        }
      }

      if (!_.every(clients, client => client.isConnected)) {
        console.error(
          `[Connector] Failed to connect to ${_.size(
            _.filter(clients, client => !client.isConnected)
          )} client(s)`
        );

        return {};
      } else {
        console.log(
          `[Connector] Connected to ${_.size(Object.keys(clients))} clients in ${((Date.now() - startTime) / 1000).toFixed(2)}s`
        );

        return clients;
      }
    }

    return {};
  }
}

module.exports = {
  Connector: new ServiceConnector()
};
