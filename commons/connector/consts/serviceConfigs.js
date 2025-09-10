const creds = require('../../../lib/credentials/config');

module.exports = {
  rabbitConfig: {
    protocol: 'amqp',
    hostname: process.env.rabbitHostname || 'localhost',
    port: process.env.rabbitPort || creds.rabbitPort,
    username: process.env.rabbitUsername || creds.rabbitUsername,
    password: process.env.rabbitPassword || creds.rabbitPassword,
    locale: 'en_US',
    frameMax: 0,
    heartbeat: 0,
    vhost: process.env.rabbitVhost || creds.rabbitVhost
  },
  sqlConfig: {
    host: process.env.db_host || creds.db_host,
    user: process.env.db_server_user || creds.db_server_user,
    password: process.env.db_pass || creds.db_pass,
    database: process.env.db_name || creds.db_name,
    port: process.env.db_port || 3306,

    waitForConnections: true,
    connectionLimit: parseInt(process.env.db_connection_limit) || 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    idleTimeout: 300000,
    maxIdle: parseInt(process.env.db_max_idle) || 10,

    multipleStatements: false,
    dateStrings: false,
    debug: process.env.NODE_ENV === 'development',
    trace: false,

    charset: 'utf8mb4',
    timezone: 'Z',

    typeCast: function (field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1';
      }
      return next();
    }
  },
  redisConfig: {
    socket: {
      host: process.env.redisHost,
      port: process.env.redisPort || 12100,
      connectTimeout: 10000,
      commandTimeout: 5000
    },
    retry: {
      attempts: 3,
      delay: Math.min(1000, 50)
    }
  },
  tmiConfig: {
    anonymous: {
      maxChannelCountPerConnection: 100,
      ignoreUnhandledPromiseRejections: true,
      connection: {
        reconnect: true,
        maxReconnectAttempts: 10,
        maxReconnectInterval: 30000,
        reconnectDecay: 1.5,
        reconnectInterval: 1000
      }
    },
    authorized: {
      username: 'ksyncbot',
      password: process.env.oauth || creds.oauth,
      ignoreUnhandledPromiseRejections: true,
      connection: {
        reconnect: true,
        maxReconnectAttempts: 10,
        maxReconnectInterval: 30000,
        reconnectDecay: 1.5,
        reconnectInterval: 1000
      }
    }
  },
  discordConfig: {
    discordLogin: process.env.discord || creds.discord,
    retryLimit: 3,
    restTimeOffset: 500
  },
  redditConfig: {
    userAgent: 'linux:ksyncbot:3.4.5 (by /u/kunszg)',
    clientId: process.env.redditUID || creds.redditUID,
    clientSecret: process.env.redditSecret || creds.redditSecret,
    username: process.env.redditUsername || creds.redditUsername,
    password: process.env.redditPassword || creds.redditPassword,
    requestTimeout: 30000,
    continueAfterRatelimitError: true
  }
};
