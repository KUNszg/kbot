const { rabbitConfig } = require('../consts/serviceConfigs');
const amqplib = require('amqplib');
const EventEmitter = require("events");

class RabbitEmitter extends EventEmitter {}

const rabbitEmitter = new RabbitEmitter();

module.exports.rabbitClient = {
  rabbitEmitter,

  connect: async function () {
    this.rabbitCon = await amqplib.connect(rabbitConfig);
  },

  async createRabbitChannel(queue) {
    const consumer = await this.rabbitCon.createChannel();
    await consumer.assertQueue(queue);

    await consumer.consume(queue, msg => {
      rabbitEmitter.emit('rabbitConsumer', msg.content.toString());
    });
  },

  async sendToQueue(queue, message) {
    const sender = await this.rabbitCon.createChannel();

    sender.sendToQueue(queue, Buffer.from(message));
  },
};
