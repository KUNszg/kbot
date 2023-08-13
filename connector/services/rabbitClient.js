const { rabbitConfig } = require('../consts/serviceConfigs');
const amqplib = require('amqplib');
const EventEmitter = require("events");

class RabbitEmitter extends EventEmitter {}

const rabbitEmitter = new RabbitEmitter();

const rabbitClient = {
  rabbitEmitter,

  connect: async function () {
    this.client = await amqplib.connect(rabbitConfig);

    rabbitClient.native = this.client;
  },

  async createRabbitChannel(queue) {
    const consumer = await this.client.createChannel();
    await consumer.assertQueue(queue);

    await consumer.consume(queue, msg => {
      rabbitEmitter.emit('rabbitConsumer', msg.content.toString());
    });
  },

  async sendToQueue(queue, message) {
    const sender = await this.client.createChannel();

    sender.sendToQueue(queue, Buffer.from(message));
  },
};

module.exports.rabbitClient = rabbitClient;