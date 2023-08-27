const creds = require('../../lib/credentials/config');

module.exports = {
  rabbitConfig: {
    protocol: 'amqp',
    hostname: 'localhost',
    port: creds.rabbitPort,
    username: creds.rabbitUsername,
    password: creds.rabbitPassword,
    locale: 'en_US',
    frameMax: 0,
    heartbeat: 0,
    vhost: creds.rabbitVhost,
  },
  sqlConfig: {
    host: creds.db_host,
    user: creds.db_server_user,
    password: creds.db_pass,
    database: creds.db_name,
  },
  redisConfigLocal: {
    socket: {
      port: 12100,
    },
  },
  tmiConfig: {
    username: 'ksyncbot',
    password: creds.oauth,
    ignoreUnhandledPromiseRejections: true,
    rateLimits: 'verifiedBot',
  },
  discordConfig: {
    discordLogin: creds.discord
  },
  redditConfig: {
    userAgent: 'linux:kunszgbot:2.0.0 (by /u/kunszg)',
    clientId: creds.redditUID,
    clientSecret: creds.redditSecret,
    username: creds.redditUsername,
    password: creds.redditPassword,
  }
};
