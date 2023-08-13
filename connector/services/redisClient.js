const redis = require('redis');

const EventEmitter = require('events');

const { redisConfigLocal } = require('../consts/serviceConfigs');

class RedisEmitter extends EventEmitter {}

const redisEmitter = new RedisEmitter();

const redisClient = {
  redisEmitter,

  connect: async function () {
    if (process.platform === 'win32') {
      this.client = await redis.createClient(redisConfigLocal);
    } else {
      this.client = redis.createClient();
    }

    redisClient.native = this.client;

    await this.client.connect();

    redisEmitter.on('error', function (error) {
      console.log(error);
    });
  },

  async get(key) {
    return await this.client.get(key);
  },

  async set(key, data = [], expire = 30) {
    return await this.client.set(key, JSON.stringify(data), { EX: expire });
  },

  async del(key) {
    return await this.client.del(key);
  },

  multi() {
    return this.client.multi();
  },

  async sendCommand(args, options) {
    return await this.client.sendCommand(args, options)
  }
};

module.exports.redisClient = redisClient;