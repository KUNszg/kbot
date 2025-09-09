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
        console.log('[Connector-RabbitMQ] Connection closed');
      });

      this.client.on('error', error => {
        this.isConnected = false;
        console.error('[Connector-RabbitMQ] Client error:', error);
      });
    }

    return this.client;
  }

  /**
   * Creates a RabbitMQ channel and consumes messages from the specified queue.
   * @param {string} queue - The name of the queue.
   * @param {Function} messageCallback - Callback function to handle incoming messages.
   * @param {Object} [config={}] - Configuration options, such as prefetchCount and delayProcessing.
   * @returns {Promise<void>}
   */
  async createRabbitChannel(queue, messageCallback, config = {}) {
    const prefetchCount = _.get(config, 'prefetchCount');
    const delayProcessing = _.get(config, 'delayProcessing');

    const consumer = await this.client.createChannel();
    await consumer.assertQueue(queue);

    if (prefetchCount) {
      await consumer.prefetch(prefetchCount);
    }

    await consumer.consume(queue, async rawMsg => {
      if (delayProcessing) {
        await sleep(delayProcessing);
      }

      const parsedMessage = JSON.parse(_.toString(_.get(rawMsg, 'content')));

      if (_.isFunction(messageCallback)) {
        messageCallback(parsedMessage, consumer, rawMsg);
      }
    });
  }

  /**
   * Sends a message to the specified RabbitMQ queue.
   * @param {string} queue - The name of the queue.
   * @param {Object} [message={}] - The message to be sent, which will be stringified.
   * @returns {Promise<boolean>} Whether the message was successfully added to the queue.
   */
  async sendToQueue(queue, message = {}) {
    const sender = await this.client.createChannel();

    const { messageCount } = await sender.assertQueue(queue, { durable: true });

    if (messageCount >= 50_000) {
      return false;
    }

    if (!_.isNil(message)) {
      message = JSON.stringify(message);
      sender.sendToQueue(queue, Buffer.from(message));
      return true;
    } else {
      console.error(
        `[Connector-RabbitMQ] ${new Date().toISOString()}: ERROR ADDING MESSAGE TO QUEUE: message is empty.\nqueue: ${queue}\nmessage: ${message}\n`
      );
      return false;
    }
  }

  async close() {
    if (this.client) {
      console.log('[Connector-RabbitMQ] Closing connection...');
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
