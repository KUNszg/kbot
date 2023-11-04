const { rabbitConfig } = require('../consts/serviceConfigs');
const amqplib = require('amqplib');
const EventEmitter = require('events');
const _ = require('lodash');

class RabbitEmitter extends EventEmitter {}

const rabbitClient = {
  rabbitEmitter: new RabbitEmitter(),

  connect: async function () {
    this.client = await amqplib.connect(rabbitConfig);

    rabbitClient.native = this.client;
  },

  async createRabbitChannel(queue) {
    const consumer = await this.client.createChannel();
    await consumer.assertQueue(queue);

    await consumer.consume(queue, msg => {
      this.rabbitEmitter.emit(queue, JSON.parse(msg.content.toString()), msg, consumer);
    });
  },

  async sendToQueue(queue, message = {}) {
    const sender = await this.client.createChannel();

    if (!_.isNil(message)) {
      message = JSON.stringify(message);
      sender.sendToQueue(queue, Buffer.from(message));
    } else {
      console.log(
        `${new Date().toISOString()}: ERROR ADDING MESSAGE TO QUEUE: message is empty.\nqueue: ${queue}\nmessage: ${message}\n`
      );
    }

    return false;
  },
};

module.exports.rabbitClient = rabbitClient;
