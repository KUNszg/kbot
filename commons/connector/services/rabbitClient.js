const EventEmitter = require('events');
const amqplib = require('amqplib');
const _ = require('lodash');

const sleep = require('../utils/sleep');
const { rabbitConfig } = require('../consts/serviceConfigs');

class RabbitEmitter extends EventEmitter {}

/**
 * Singleton class for managing RabbitMQ connections and channels.
 */
class RabbitClient {
  constructor() {
    if (!RabbitClient.instance) {
      RabbitClient.instance = this;
      this.client = null;
      this.rabbitEmitter = new RabbitEmitter();
      this.isConnected = false;

      this.publishChannel = null;
      this.consumerChannels = new Map();
      this.queueSizeCache = new Map();
      this.queueSizeTimestamps = new Map();
    }

    return RabbitClient.instance;
  }

  /**
   * Establishes a connection to the RabbitMQ server.
   * If a connection already exists, it returns the existing connection.
   * @returns {Promise<amqplib.Connection>} The RabbitMQ connection instance.
   * @throws {Error} If there is an error establishing the connection.
   */
  async connect() {
    if (!this.client) {
      this.client = await amqplib.connect(rabbitConfig);

      RabbitClient.instance.native = this.client;

      this.isConnected = true;
      console.log('[Connector-RabbitMQ] Connected');

      this.client.on('close', () => {
        this.isConnected = false;
        this.publishChannel = null;
        this.consumerChannels.clear();
        console.log('[Connector-RabbitMQ] Connection closed');
      });

      this.client.on('error', error => {
        this.isConnected = false;
        this.publishChannel = null;
        this.consumerChannels.clear();
        console.error('[Connector-RabbitMQ] Client error:', error);
      });

      await this.createPublishChannel();
    }

    return this.client;
  }

  async createPublishChannel() {
    if (!this.publishChannel) {
      this.publishChannel = await this.client.createChannel();

      this.publishChannel.on('error', error => {
        console.error('[Connector-RabbitMQ] Publish channel error:', error);
        this.publishChannel = null;
      });

      this.publishChannel.on('close', () => {
        console.log('[Connector-RabbitMQ] Publish channel closed');
        this.publishChannel = null;
      });
    }
  }

  /**
   * Creates a RabbitMQ channel and consumes messages from the specified queue.
   * @param {string} queue - The name of the queue.
   * @param {Function} messageCallback - Callback function to handle incoming messages.
   * @param {Object} [config={}] - Configuration options, such as prefetchCount and delayProcessing.
   * @returns {Promise<void>}
   */
  async createRabbitChannel(queue, messageCallback, config = {}) {
    if (this.consumerChannels.has(queue)) {
      console.warn(`[Connector-RabbitMQ] Consumer already exists for queue: ${queue}`);
      return;
    }

    const prefetchCount = _.get(config, 'prefetchCount');
    const delayProcessing = _.get(config, 'delayProcessing');

    const consumer = await this.client.createChannel();
    await consumer.assertQueue(queue);

    this.consumerChannels.set(queue, consumer);

    consumer.on('error', error => {
      console.error(`[Connector-RabbitMQ] Consumer channel error for queue ${queue}:`, error);
      this.consumerChannels.delete(queue);
    });

    consumer.on('close', () => {
      console.log(`[Connector-RabbitMQ] Consumer channel closed for queue: ${queue}`);
      this.consumerChannels.delete(queue);
    });

    if (prefetchCount) {
      await consumer.prefetch(prefetchCount);
    }

    await consumer.consume(queue, async rawMsg => {
      if (delayProcessing) {
        await sleep(delayProcessing);
      }

      try {
        const parsedMessage = JSON.parse(_.toString(_.get(rawMsg, 'content')));

        if (_.isFunction(messageCallback)) {
          await messageCallback(parsedMessage, consumer, rawMsg);
        }
      } catch (error) {
        console.error(
          `[Connector-RabbitMQ] Error processing message from queue ${queue}:`,
          error
        );
        consumer.nack(rawMsg, false, false);
      }
    });
  }

  async getQueueSize(queue, maxAge = 5000) {
    const now = Date.now();
    const lastCheck = this.queueSizeTimestamps.get(queue) || 0;

    if (now - lastCheck < maxAge) {
      return this.queueSizeCache.get(queue) || 0;
    }

    const { messageCount } = await this.publishChannel.checkQueue(queue);
    this.queueSizeCache.set(queue, messageCount);
    this.queueSizeTimestamps.set(queue, now);

    return messageCount;
  }

  /**
   * Sends a message to the specified RabbitMQ queue.
   * @param {string} queue - The name of the queue.
   * @param {Object} [message={}] - The message to be sent, which will be stringified.
   * @param {Object} [options={}] - Options eg. checkLimit, maxQueueSize
   * @returns {Promise<boolean>} Whether the message was successfully added to the queue.
   */
  async sendToQueue(queue, message = {}, options = {}) {
    try {
      if (!this.publishChannel) {
        await this.createPublishChannel();
      }

      await this.publishChannel.assertQueue(queue, { durable: true });

      const checkLimit = _.get(options, 'checkLimit', false);
      const maxQueueSize = _.get(options, 'maxQueueSize', 10000);

      if (checkLimit) {
        const messageCount = await this.getQueueSize(queue);

        if (messageCount >= maxQueueSize) {
          return false;
        }
      }

      if (!_.isNil(message)) {
        const messageString = JSON.stringify(message);
        const success = this.publishChannel.sendToQueue(queue, Buffer.from(messageString), {
          persistent: true
        });

        if (!success) {
          await new Promise(resolve => {
            this.publishChannel.once('drain', resolve);
          });
        }

        return true;
      } else {
        console.error(
          `[Connector-RabbitMQ] ${new Date().toISOString()}: ERROR ADDING MESSAGE TO QUEUE: message is empty.\nqueue: ${queue}\nmessage: ${message}\n`
        );
        return false;
      }
    } catch (error) {
      console.error(`[Connector-RabbitMQ] Error sending message to queue ${queue}:`, error);
      return false;
    }
  }

  /**
   * Closes a specific consumer channel
   * @param {string} queue - The queue name whose consumer channel to close
   */
  async closeConsumerChannel(queue) {
    const channel = this.consumerChannels.get(queue);
    if (channel) {
      try {
        await channel.close();
        this.consumerChannels.delete(queue);
        console.log(`[Connector-RabbitMQ] Closed consumer channel for queue: ${queue}`);
      } catch (error) {
        console.error(
          `[Connector-RabbitMQ] Error closing consumer channel for queue ${queue}:`,
          error
        );
      }
    }
  }

  async close() {
    if (this.client) {
      console.log('[Connector-RabbitMQ] Closing connection...');

      for (const [queue, channel] of this.consumerChannels) {
        try {
          await channel.close();
        } catch (error) {
          console.error(
            `[Connector-RabbitMQ] Error closing consumer channel for queue ${queue}:`,
            error
          );
        }
      }
      this.consumerChannels.clear();

      if (this.publishChannel) {
        try {
          await this.publishChannel.close();
        } catch (error) {
          console.error('[Connector-RabbitMQ] Error closing publish channel:', error);
        }
        this.publishChannel = null;
      }

      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log('[Connector-RabbitMQ] Connection closed');
    }
  }
}

module.exports = {
  rabbitClient: new RabbitClient()
};
