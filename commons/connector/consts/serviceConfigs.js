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
    port: process.env.db_port || 3306
  },
  redisConfig: {
    socket: {
      host: process.env.redisHost,
      port: process.env.redisPort || 12100
    }
    //url: `redis://${process.env.redisHost}:${process.env.redisPort || 12100}`,
  },
  tmiConfig: {
    anonymous: {
      maxChannelCountPerConnection: 100,
      ignoreUnhandledPromiseRejections: true
    },
    authorized: {
      username: 'ksyncbot',
      password: process.env.oauth || creds.oauth,
      ignoreUnhandledPromiseRejections: true
    }
  },
  discordConfig: {
    discordLogin: process.env.discord || creds.discord
  },
  redditConfig: {
    userAgent: 'linux:ksyncbot:3.4.0 (by /u/kunszg)',
    clientId: process.env.redditUID || creds.redditUID,
    clientSecret: process.env.redditSecret || creds.redditSecret,
    username: process.env.redditUsername || creds.redditUsername,
    password: process.env.redditPassword || creds.redditPassword
  }
};
