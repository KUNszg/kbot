const redis = require('redis');
const EventEmitter = require('events');
const { redisConfig } = require('../consts/serviceConfigs');

class RedisEmitter extends EventEmitter {}

/**
 * Singleton class for managing Redis connections and executing commands.
 */
class RedisClient {
  constructor() {
    if (!RedisClient.instance) {
      RedisClient.instance = this;
      this.client = null;
      this.isConnected = false;
      this.redisEmitter = new RedisEmitter();
    }

    return RedisClient.instance;
  }

  /**
   * Establishes a connection to the Redis server.
   * If a connection already exists, it returns the existing connection.
   * @returns {Promise<redis.RedisClientType>} The Redis client instance.
   * @throws {Error} If there is an error establishing the connection.
   */
  async connect() {
    if (!this.client) {
      this.client = redis.createClient(redisConfig);
      RedisClient.instance.native = this.client;

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('Redis connected');
      });

      this.client.on('error', error => {
        console.error('Redis client error:', error);
        this.isConnected = false;
        this.redisEmitter.emit('error', error);
      });

      try {
        await this.client.connect();
      } catch (error) {
        console.error('Redis connection error:', error);
        this.isConnected = false;
        this.client = null;
      }
    }

    return this.client;
  }

  /**
   * Retrieves a value from Redis by key.
   * @param {string} key - The key of the value to retrieve.
   * @returns {Promise<string|null>} The value associated with the key, or null if not found.
   */
  async get(key) {
    const value = await this.client.get(key);

    if (value && typeof value === 'string' && value.trim() !== '') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error('Error parsing Redis value:', error);
      }
    }
    return value;
  }

  /**
   * Sets a value in Redis with an optional expiration time.
   * @param {string} key - The key to set.
   * @param {Object} data - The data to store, which will be stringified.
   * @param {number} [expire=30] - The expiration time in seconds (default is 30 seconds).
   * @returns {Promise<string>} The result of the set operation.
   */
  async set(key, data = {}, expire = 30) {
    return await this.client.set(key, JSON.stringify(data), { EX: expire });
  }

  /**
   * Deletes a value from Redis by key.
   * @param {string} key - The key of the value to delete.
   * @returns {Promise<number>} The number of keys that were removed.
   */
  async del(key) {
    return await this.client.del(key);
  }

  /**
   * Initiates a Redis multi command transaction.
   * @returns {redis.RedisClientType.Multi} A multi command instance.
   */
  multi() {
    return this.client.multi();
  }

  /**
   * Sends a custom Redis command.
   * @param {Array} args - The command arguments.
   * @param {Object} [options] - Optional additional options for the command.
   * @returns {Promise<any>} The result of the command.
   */
  async sendCommand(args, options) {
    return await this.client.sendCommand(args, options);
  }
}

module.exports = {
  redisClient: new RedisClient(),
};
