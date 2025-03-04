const { ChatClient } = require('dank-twitch-irc');
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
      this.client = null;
      this.tmiEmitter = new TmiEmitter();
      this.service = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }

    return TmiClient.instance;
  }

  setServiceConnector(serviceConnector) {
    this.service = serviceConnector;
  }

  /**
   * Establishes a connection to the Twitch chat using dank-twitch-irc.
   * @param {Object} connectionArgs - Connection arguments containing config and type.
   * @param {Object} [connectionArgs.config] - Optional custom configuration for the chat client.
   * @param {string} [connectionArgs.type] - Type of connection, used for selecting channels.
   * @returns {Promise<void>}
   * @throws {Error} If there is an error during connection.
   */
  async connect(connectionArgs) {
    if (this.isConnected) return; // If already connected, do nothing

    // Ensure that any method waits for the connection to complete before executing
    this.connectionPromise = this._connectInternal(connectionArgs);
    await this.connectionPromise;
  }

  /**
   * Internal method to handle the actual connection process.
   * @private
   * @param {Object} connectionArgs - Connection arguments containing config and type.
   * @returns {Promise<void>}
   */
  async _connectInternal(connectionArgs) {
    const { config, type } = connectionArgs || {};

    const serviceConnector = require('../serviceConnector');
    this.service =
      this.service ||
      (await serviceConnector.Connector.dependencies(['sql', 'redis', 'rabbit']));

    this.client = config ? new ChatClient(config) : new ChatClient(tmiConfig);

    let channels;

    if (process.platform !== 'win32') {
      const owner = await this.service.sqlClient.query(
        `SELECT * FROM trusted_users WHERE ID="75"`
      );
      channels = [_.get(owner, '0.username'), 'nymn', 'forsen'];
    } else {
      if (type) {
        channels = await this.service.sqlClient.query('SELECT * FROM channels_logger');
      } else {
        channels = await this.service.sqlClient.query('SELECT * FROM channels');
      }
      channels = channels.map(i => i.channel);
    }

    this.client.on('connect', () => {
      this.tmiEmitter.emit('connected', true);

      this.isConnected = true;

      if (MODE === 'production') {
        console.log(`TMI connected, beginning to join ${_.size(channels)} channels...`);
      } else {
        console.log(
          `TMI connected in development mode, beginning to join #ksyncbot channel...`
        );
      }
    });

    await this.client.connect();
    TmiClient.instance.native = this.client;

    this.client.on('close', error => {
      this.tmiEmitter.emit('close', error);

      this.isConnected = false;

      console.log('TMI connection closed');
    });

    if (MODE === 'production') {
      await this.client.joinAll(channels).catch(err => {
        console.log(err);
      });
    } else {
      await this.client.join('#ksyncbot');
    }

    this._setupEventHandlers();

    console.log('TMI ready');

    let notJoinedChannels = [];

    for (let connection of this.client.connections) {
      notJoinedChannels.push(
        ..._.difference([...connection.wantedChannels], [...connection.joinedChannels])
      );
    }

    if (!!_.size(notJoinedChannels)) {
      console.log(
        `TMI failed to join ${`${_.size(notJoinedChannels)}/${_.size(channels)}`} channels.`
      );

      await this.service.rabbitClient.sendToQueue(
        'KB_TWITCH_CHANNELS_TO_PART',
        notJoinedChannels
      );
    }
  }

  /**
   * Ensures that the connection is established before executing any method.
   * @private
   * @returns {Promise<void>}
   */
  async _ensureConnected() {
    if (this.connectionPromise) {
      await this.connectionPromise;
    } else if (!this.isConnected) {
      throw new Error('TMI client is not connected. Please call "connect" first.');
    }
  }

  /**
   * Sets up all event handlers for the Twitch chat client.
   * @private
   */
  _setupEventHandlers() {
    this.client.on('PRIVMSG', msg => {
      const oldFormat = {
        color: msg.colorRaw,
        username: msg.senderUsername,
        'message-type': 'chat',
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
        this.tmiEmitter.emit('action', `#${msg.channelName}`, msg, msg.messageText, self);
      } else {
        this.tmiEmitter.emit('message', `#${msg.channelName}`, msg, msg.messageText, self);
      }
    });

    this.client.on('rawCommand', cmd => this.tmiEmitter.emit('rawCommand', cmd));
    this.client.on('CLEARCHAT', msg => {
      if (msg.targetUsername) {
        this.tmiEmitter.emit(
          'timeout',
          `#${msg.channelName}`,
          msg.targetUsername,
          'timeout',
          msg.banDuration,
          msg
        );
      } else {
        this.tmiEmitter.emit('clearchat', `#${msg.channelName}`);
      }
    });
    this.client.on('CLEARMSG', clearmsgMessage =>
      this.tmiEmitter.emit('clearmsg', clearmsgMessage)
    );
    this.client.on('HOSTTARGET', hosttargetMessage =>
      this.tmiEmitter.emit('host', hosttargetMessage)
    );
    this.client.on('NOTICE', msg => {
      this.tmiEmitter.emit(
        'notice',
        `#${msg.channelName}`,
        msg.messageID,
        _.get(msg, 'messageText', _.stubString())
      );
    });
    this.client.on('ROOMSTATE', roomstateMessage =>
      this.tmiEmitter.emit('roomstate', roomstateMessage)
    );
    this.client.on('USERNOTICE', usernoticeMessage =>
      this.tmiEmitter.emit('usernotice', usernoticeMessage)
    );
    this.client.on('USERSTATE', userstateMessage =>
      this.tmiEmitter.emit('userstate', userstateMessage)
    );
    this.client.on('GLOBALUSERSTATE', globaluserstateMessage =>
      this.tmiEmitter.emit('globaluserstate', globaluserstateMessage)
    );
    this.client.on('WHISPER', msg => {
      const oldFormat = {
        color: msg.colorRaw,
        username: msg.senderUsername,
        'message-type': 'chat',
      };

      delete msg.color;

      msg = { ...msg.ircTags, ...oldFormat, ...msg };

      delete msg.ircTags;

      const username = msg.senderUsername;
      const message = msg.messageText;
      const self = msg['user-id'] === '229225576';

      this.tmiEmitter.emit('whisper', username, msg, message, self);
    });
    this.client.on('JOIN', joinMessage => this.tmiEmitter.emit('join', joinMessage));
    this.client.on('PART', partMessage => this.tmiEmitter.emit('part', partMessage));
    this.client.on('CAP', capMessage => this.tmiEmitter.emit('cap', capMessage));
  }

  /**
   * Joins a Twitch channel (for session).
   * @param {string} channel - The channel to join.
   * @returns {Promise<void>}
   */
  async join(channel) {
    await this._ensureConnected();
    channel = channel.startsWith('#') ? channel : `#${channel}`;
    this.client.join(channel);
  }

  /**
   * Leaves a Twitch channel (for session).
   * @param {string} channel - The channel to leave.
   * @returns {Promise<void>}
   */
  async part(channel) {
    await this._ensureConnected();
    channel = channel.startsWith('#') ? channel : `#${channel}`;
    this.client.part(channel);
  }

  /**
   * Posts a /me message in the given channel.
   * @param {string} channel - The channel to send the message to.
   * @param {string} message - The message to send.
   * @returns {Promise<void>}
   */
  async action(channel, message) {
    await this._ensureConnected();
    channel = channel.startsWith('#') ? channel : `#${channel}`;
    this.client.me(channel, message);
  }

  /**
   * Timeouts a user in a channel.
   * @param {string} channel - The channel in which to timeout the user.
   * @param {string} username - The username of the person to timeout.
   * @param {number} length - The duration of the timeout in seconds.
   * @param {string} [reason=''] - The reason for the timeout.
   * @returns {Promise<void>}
   */
  async timeout(channel, username, length, reason = '') {
    await this._ensureConnected();
    this.client.timeout(channel.replace('#', ''), username, length, reason);
  }

  /**
   * Bans a user in a channel.
   * @param {string} channel - The channel in which to ban the user.
   * @param {string} username - The username of the person to ban.
   * @param {string} [reason=''] - The reason for the ban.
   * @returns {Promise<void>}
   */
  async ban(channel, username, reason = '') {
    await this._ensureConnected();
    this.client.ban(channel.replace('#', ''), username, reason);
  }

  /**
   * Sends a whisper to a user.
   * @param {string} username - The username of the person to whisper.
   * @param {string} message - The message to send.
   * @returns {Promise<void>}
   */
  async whisper(username, message) {
    await this._ensureConnected();
    message = message.replace(/(\r\n|\n|\r)/gm, '');

    await this.client.whisper(username, message);

    await this.service.sqlClient.query(
      `
      INSERT INTO whispers_sent (username, message, date)
      VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [username, message]
    );
  }

  /**
   * Sets the bot's color.
   * @param {string} color - The color to set.
   * @returns {Promise<void>}
   */
  async setColor(color) {
    await this._ensureConnected();
    this.client.setColor(color);
  }

  /**
   * Gets the list of mods in a channel.
   * @param {string} channel - The channel to get the mods from.
   * @returns {Promise<Array<string>>} A promise that resolves to an array of mod usernames.
   */
  async getMods(channel) {
    await this._ensureConnected();
    return this.client.getMods(channel);
  }

  /**
   * Gets the list of VIPs in a channel.
   * @param {string} channel - The channel to get the VIPs from.
   * @returns {Promise<Array<string>>} A promise that resolves to an array of VIP usernames.
   */
  async getVips(channel) {
    await this._ensureConnected();
    return this.client.getVips(channel);
  }

  /**
   * Sends a ping to the Twitch IRC server.
   * @returns {Promise<void>} A promise that resolves when the ping is sent.
   */
  async ping() {
    await this._ensureConnected();
    return this.client.ping();
  }

  /**
   * Sends a raw PRIVMSG to the given channel.
   * @param {string} channel - The channel to send the message to.
   * @param {string} message - The message to send.
   * @returns {Promise<void>}
   */
  async sayRaw(channel, message) {
    await this._ensureConnected();
    this.client.privmsg(channel, message);
  }

  /**
   * Sends a message to a channel, handling throttling and message splitting.
   * @param {string} channel - The channel to send the message to.
   * @param {string} message - The message to send.
   * @returns {Promise<void>} A promise that resolves when the message has been sent.
   */
  say = async (channel, message) => {
    await this._ensureConnected();
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

    // Split the message in separate chunks if it exceeds 500 characters
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
  }
}

module.exports = {
  tmiClient: new TmiClient(),
};
