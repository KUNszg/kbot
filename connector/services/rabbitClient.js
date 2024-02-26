const EventEmitter = require('events');

const amqplib = require('amqplib');
const _ = require('lodash');

const sleep = require("../../connector/utils/sleep");
const { rabbitConfig } = require('../consts/serviceConfigs');

class RabbitEmitter extends EventEmitter {}

const rabbitClient = {
  rabbitEmitter: new RabbitEmitter(),

  connect: async function () {
    this.client = await amqplib.connect(rabbitConfig);

    rabbitClient.native = this.client;
  },

  async createRabbitChannel(queue, messageCallback, config) {
    const prefetchCount = _.get(config, "prefetchCount");
    const delayProcessing = _.get(config, "delayProcessing");

    const consumer = await this.client.createChannel();
    await consumer.assertQueue(queue);

    if (prefetchCount) {
      await consumer.prefetch(prefetchCount)
    }

    await consumer.consume(queue, async (rawMsg) => {
      if (delayProcessing) {
        await sleep(delayProcessing)
      }

      const parsedMessage = JSON.parse(_.toString(_.get(rawMsg, "content")));

      if (_.isFunction(messageCallback)) {
        messageCallback(parsedMessage, consumer, rawMsg);
      }
    });
  },

  async sendToQueue(queue, message = {}) {
    const sender = await this.client.createChannel();

    await sender.assertQueue(queue);

    if (!_.isNil(message)) {
      message = JSON.stringify(message);
      sender.sendToQueue(queue, Buffer.from(message));
    } else {
      console.error(
        `${new Date().toISOString()}: ERROR ADDING MESSAGE TO QUEUE: message is empty.\nqueue: ${queue}\nmessage: ${message}\n`
      );
    }

    return false;
  },
};

module.exports.rabbitClient = rabbitClient;
