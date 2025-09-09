const { ChatClient } = require('@mastondzn/dank-twitch-irc');
const _ = require('lodash');
const EventEmitter = require('events');
const { tmiConfig } = require('../consts/serviceConfigs');
const sleep = require('../utils/sleep');
const prepareMessage = require('../utils/prepareMessage');
const endecrypt = require('../utils/endecrypt');

const MODE = process.env.MODE || 'production';

class TmiEmitter extends EventEmitter {}

/**
 * Singleton class for managing Twitch chat connections and related operations.
 */
class TmiClient {
  constructor() {
    if (!TmiClient.instance) {
      TmiClient.instance = this;
      this.consumer = this._createConsumer();
      this.sender = this._createSender();
      this.service = null;
      this.isConsumerConnected = false;
      this.isSenderConnected = false;
      this.consumerConnectionPromise = null;
      this.senderConnectionPromise = null;
    }

    return TmiClient.instance;
  }

  get isConnected() {
    return this.isConsumerConnected || this.isSenderConnected;
  }

  /**
   * Ensures that a client is connected before executing operations
   * @returns {Promise<void>}
   */
  async _ensureConnected() {
    const instance = TmiClient.instance;

    if (this.clientType === 'sender') {
      if (instance.senderConnectionPromise) {
        await instance.senderConnectionPromise;
      } else if (!instance.isSenderConnected) {
        throw new Error('Sender TMI client is not connected');
      }
    } else if (this.clientType === 'consumer') {
      if (instance.consumerConnectionPromise) {
        await instance.consumerConnectionPromise;
      } else if (!instance.isConsumerConnected) {
        throw new Error('Consumer TMI client is not connected');
      }
    } else {
      throw new Error('Unknown client type');
    }
  }

  /**
   * Creates the consumer part of the Twitch chat client with anonymous config
   * @private
   * @returns {Object} Consumer instance with event handling capabilities
   */
  _createConsumer() {
    const tmiEmitter = new TmiEmitter();

    const consumer = {
      client: null,
      tmiEmitter,

      /**
       * Sets up event handlers for the Twitch chat client
       * @param {Object} client - The Twitch chat client instance
       */
      setupEventHandlers(client) {
        client.on('PRIVMSG', msg => {
          const oldFormat = {
            color: msg.colorRaw,
            username: msg.senderUsername,
            'message-type': 'chat'
          };

          delete msg.color;

          msg = { ...msg.ircTags, ...oldFormat, ...msg };

          delete msg.ircTags;

          const self = msg['user-id'] === '229225576';
          const getAction = _.includes(
            _.get(_.split(_.get(msg, 'ircParameters.1'), ' '), '0'),
            'ACTION'
          );

          if (getAction) {
            tmiEmitter.emit('action', `#${msg.channelName}`, msg, msg.messageText, self);
          } else {
            tmiEmitter.emit('message', `#${msg.channelName}`, msg, msg.messageText, self);
          }
        });

        client.on('rawCommand', cmd => tmiEmitter.emit('rawCommand', cmd));
        client.on('CLEARCHAT', msg => {
          if (msg.targetUsername) {
            tmiEmitter.emit(
              'timeout',
              `#${msg.channelName}`,
              msg.targetUsername,
              'timeout',
              msg.banDuration,
              msg
            );
          } else {
            tmiEmitter.emit('clearchat', `#${msg.channelName}`);
          }
        });
        client.on('CLEARMSG', clearmsgMessage => tmiEmitter.emit('clearmsg', clearmsgMessage));
        client.on('HOSTTARGET', hosttargetMessage =>
          tmiEmitter.emit('host', hosttargetMessage)
        );
        client.on('NOTICE', msg => {
          tmiEmitter.emit(
            'notice',
            `#${msg.channelName}`,
            msg.messageID,
            _.get(msg, 'messageText', _.stubString())
          );
        });
        client.on('ROOMSTATE', roomstateMessage =>
          tmiEmitter.emit('roomstate', roomstateMessage)
        );
        client.on('USERNOTICE', usernoticeMessage =>
          tmiEmitter.emit('usernotice', usernoticeMessage)
        );
        client.on('USERSTATE', userstateMessage =>
          tmiEmitter.emit('userstate', userstateMessage)
        );
        client.on('GLOBALUSERSTATE', globaluserstateMessage =>
          tmiEmitter.emit('globaluserstate', globaluserstateMessage)
        );
        client.on('WHISPER', msg => {
          const oldFormat = {
            color: msg.colorRaw,
            username: msg.senderUsername,
            'message-type': 'chat'
          };

          delete msg.color;

          msg = { ...msg.ircTags, ...oldFormat, ...msg };

          delete msg.ircTags;

          const username = msg.senderUsername;
          const message = msg.messageText;
          const self = msg['user-id'] === '229225576';

          tmiEmitter.emit('whisper', username, msg, message, self);
        });
        client.on('JOIN', joinMessage => tmiEmitter.emit('join', joinMessage));
        client.on('PART', partMessage => tmiEmitter.emit('part', partMessage));
        client.on('CAP', capMessage => tmiEmitter.emit('cap', capMessage));
      },

      /**
       * Gets the event emitter for listening to Twitch chat events
       * @returns {TmiEmitter} The event emitter
       */
      getEmitter() {
        return tmiEmitter;
      },

      /**
       * Joins a Twitch channel
       * @param {string} channel - The channel to join
       * @returns {Promise<void>}
       */
      async join(channel) {
        if (!this.client) {
          throw new Error('Consumer client is not initialized');
        }

        await this._ensureConnected.call(this);

        channel = channel.startsWith('#') ? channel : `#${channel}`;
        await this.client.join(channel);
      },

      /**
       * Leaves a Twitch channel
       * @param {string} channel - The channel to leave
       * @returns {Promise<void>}
       */
      async part(channel) {
        if (!this.client) {
          throw new Error('Consumer client is not initialized');
        }

        await this._ensureConnected.call(this);

        channel = channel.startsWith('#') ? channel : `#${channel}`;
        await this.client.part(channel);
      }
    };

    consumer.clientType = 'consumer';
    consumer._ensureConnected = this._ensureConnected.bind(consumer);

    return consumer;
  }

  /**
   * Creates the sender part of the Twitch chat client with authorized config
   * @private
   * @returns {Object} Sender instance with message sending capabilities
   */
  _createSender() {
    const sender = {
      client: null,
      service: null,

      /**
       * Sends a message to a channel with throttling and message splitting
       * @param {string} channel - The channel to send the message to
       * @param {string} message - The message to send
       * @returns {Promise<void>}
       */
      async say(channel, message) {
        if (!this.client) {
          throw new Error('Sender client is not initialized');
        }

        await this._ensureConnected.call(this);

        channel = channel[0] === '#' ? channel : `#${channel}`;
        message = message.replace(/\n|\r/g, '');

        if (!_.isString(message)) {
          message = JSON.stringify(message);
        }

        const lastMessage = await this.service.redisClient.get(`kbot:lastMessage:${channel}`);

        const lastMessageTimeoutLock = await this.service.redisClient.get(
          `kbot:lastMessageTimeoutLock:${channel}`
        );

        if (lastMessageTimeoutLock) {
          await sleep(4500);
        }

        const sayMessage = async (channel, message) => {
          await this.client.say(channel, message);

          const messageHash = _.get(endecrypt.encrypt(message), 'encryptedData');

          await this.service.redisClient.set(`kbot:lastMessage:${channel}`, messageHash, 30);
          await this.service.redisClient.set(
            `kbot:lastMessageTimeoutLock:${channel}`,
            ['true'],
            4
          );
        };

        if (message.length > 500) {
          const _message = _.chunk(_.split(message, ''), 500);

          for (let messageChunk of _message) {
            messageChunk = prepareMessage(messageChunk, lastMessage);

            if (_message.length > 1500) {
              await sayMessage(channel, 'Response too long (1500+ characters)');
              return null;
            }

            await sayMessage(channel, messageChunk);
          }
        } else {
          const _message = prepareMessage(message, lastMessage);
          await sayMessage(channel, _message);
        }
      },

      /**
       * Posts a /me message in the given channel
       * @param {string} channel - The channel to send the message to
       * @param {string} message - The message to send
       * @returns {Promise<void>}
       */
      async action(channel, message) {
        if (!this.client) {
          throw new Error('Sender client is not initialized');
        }

        await this._ensureConnected.call(this);

        channel = channel.startsWith('#') ? channel : `#${channel}`;
        await this.client.me(channel, message);
      },

      /**
       * Timeouts a user in a channel
       * @param {string} channel - The channel in which to timeout the user
       * @param {string} username - The username of the person to timeout
       * @param {number} length - The duration of the timeout in seconds
       * @param {string} [reason=''] - The reason for the timeout
       * @returns {Promise<void>}
       */
      async timeout(channel, username, length, reason = '') {
        if (!this.client) {
          throw new Error('Sender client is not initialized');
        }

        await this._ensureConnected.call(this);

        await this.client.timeout(channel.replace('#', ''), username, length, reason);
      },

      /**
       * Sends a whisper to a user
       * @param {string} username - The username of the person to whisper
       * @param {string} message - The message to send
       * @returns {Promise<void>}
       */
      async whisper(username, message) {
        if (!this.client) {
          throw new Error('Sender client is not initialized');
        }

        await this._ensureConnected.call(this);

        message = message.replace(/(\r\n|\n|\r)/gm, '');

        await this.client.whisper(username, message);

        await this.service.sqlClient.query(
          `
              INSERT INTO whispers_sent (username, message, date)
              VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [username, message]
        );
      }
    };

    sender.clientType = 'sender';
    sender._ensureConnected = this._ensureConnected.bind(sender);

    return sender;
  }

  /**
   * Sets the service connector for database operations
   * @param {Object} serviceConnector - The service connector
   */
  setServiceConnector(serviceConnector) {
    this.service = serviceConnector;
  }

  /**
   * Establishes connections for both consumer and sender
   * @param {Object} connectionArgs - Connection arguments
   * @returns {Promise<void>}
   */
  async connect(connectionArgs) {
    const { isLogger = false, isSender = true, isConsumer = true } = connectionArgs || {};

    const serviceConnector = require('../serviceConnector');

    this.service =
      this.service ||
      (await serviceConnector.Connector.dependencies(['sql', 'redis', 'rabbit']));

    if (isConsumer) {
      this.consumerConnectionPromise = this._connectConsumer(isLogger);
    }

    if (isSender) {
      this.senderConnectionPromise = this._connectSender();
    }

    await Promise.all(
      _.compact([this.consumerConnectionPromise, this.senderConnectionPromise])
    );

    this.consumerConnectionPromise = null;
    this.senderConnectionPromise = null;
  }

  /**
   * Connects the consumer client with anonymous config and joins channels
   * @private
   * @param {Boolean} [isLogger] - Process type for channel selection
   * @returns {Promise<void>}
   */
  async _connectConsumer(isLogger) {
    if (this.isConsumerConnected) return;

    const consumerClient = new ChatClient(tmiConfig.anonymous);
    this.consumer.client = consumerClient;

    let channels = [];

    if (process.platform === 'win32') {
      const owner = await this.service.sqlClient.query(
        `SELECT * FROM trusted_users WHERE ID="75"`
      );
      channels = [_.get(owner, '0.username'), 'nymn', 'forsen'];
    } else {
      if (isLogger) {
        channels = await this.service.sqlClient.query('SELECT * FROM channels_logger');
      } else {
        channels = await this.service.sqlClient.query('SELECT * FROM channels');
      }
      channels = channels.map(i => i.channel);
    }

    consumerClient.on('connect', () => {
      this.consumer.getEmitter().emit('connected', true);
      this.isConsumerConnected = true;

      if (MODE === 'production') {
        console.log(
          `[Connector-TMI] Consumer connected, beginning to join ${_.size(channels)} channels...`
        );
      } else {
        console.log(
          `[Connector-TMI] Consumer connected in development mode, beginning to join #ksyncbot channel...`
        );
      }
    });

    await consumerClient.connect();

    consumerClient.on('close', error => {
      this.consumer.getEmitter().emit('close', error);

      this.isConsumerConnected = false;

      console.log('[Connector-TMI] Consumer connection closed');
    });

    this.consumer.setupEventHandlers(consumerClient);

    for (let channel of channels) {
      if (MODE === 'development') {
        await consumerClient.join('#ksyncbot');
        break;
      }

      try {
        await consumerClient.join(channel);
      } catch (err) {
        console.log('[Connector-TMI]', err.message);
      }

      await sleep(500);
    }

    console.log('[Connector-TMI] Consumer ready');

    let notJoinedChannels = [];

    for (let connection of consumerClient.connections) {
      notJoinedChannels.push(
        ..._.difference([...connection.wantedChannels], [...connection.joinedChannels])
      );
    }

    if (!!_.size(notJoinedChannels)) {
      console.log(
        `[Connector-TMI] Consumer failed to join ${_.size(notJoinedChannels)}/${_.size(channels)} channels.`
      );

      await this.service.rabbitClient.sendToQueue(
        'KB_TWITCH_CHANNELS_TO_PART',
        notJoinedChannels
      );
    }
  }

  /**
   * Connects the sender client with authorized config
   * @private
   * @returns {Promise<void>}
   */
  async _connectSender() {
    if (this.isSenderConnected) return;

    const senderClient = new ChatClient(tmiConfig.authorized);
    this.sender.client = senderClient;
    this.sender.service = this.service;

    senderClient.on('connect', () => {
      this.isSenderConnected = true;
      console.log('[Connector-TMI] Sender connected');
    });

    await senderClient.connect();

    senderClient.on('close', error => {
      this.isSenderConnected = false;
      console.log('[Connector-TMI] Sender connection closed');
    });

    console.log('[Connector-TMI] Sender ready');
  }

  async close() {
    console.log('[Connector-TMI] Closing connections...');

    if (this.consumer.client) {
      await this.consumer.client.close();
      this.isConsumerConnected = false;
    }

    if (this.sender.client) {
      await this.sender.client.close();
      this.isSenderConnected = false;
    }

    console.log('[Connector-TMI] Connections closed');
  }
}

module.exports = {
  tmiClient: new TmiClient()
};
