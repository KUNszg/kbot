const { ChatClient } = require('dank-twitch-irc');
const _ = require('lodash');
const EventEmitter = require('events');

const { tmiConfig } = require('../consts/serviceConfigs');

const sleep = require('../utils/sleep');
const prepareMessage = require('../utils/prepareMessage');
const endecrypt = require('../utils/endecrypt');

const serviceConnector = require('../serviceConnector.js');

class TmiEmitter extends EventEmitter {}

const tmiClient = {
  tmiEmitter: new TmiEmitter(),

  connect: async function (connectionArgs) {
    const { config, type } = connectionArgs || {};

    this.service = await serviceConnector.Connector.dependencies(['sql', 'redis']);

    if (config) {
      this.client = new ChatClient(config);
    } else {
      this.client = new ChatClient(tmiConfig);
    }

    await this.client.connect();

    tmiClient.native = this.client;

    let channels;

    if (process.platform === 'win32') {
      const owner = await this.service.sqlClient.query(
        `SELECT * FROM trusted_users WHERE ID="75"`
      );
      channels = [_.get(owner, '0.username')];
    } else {
      if (type) {
        channels = await this.service.sqlClient.query('SELECT * FROM channels_logger');
      } else {
        channels = await this.service.sqlClient.query('SELECT * FROM channels');
      }
      channels = channels.map(i => i.channel);
    }

    this.client.joinAll(channels).catch(err => {
      console.log(err);
    });

    // Called on incoming messages whose command is PRIVMSG.
    // The message parameter is always instanceof PrivmsgMessage.
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

    // Called when the client is terminated as a whole. Not called for individual
    // connections that were disconnected. Can be caused for example by a invalid
    // OAuth token (failure to login), or when client.close() or client.destroy()
    // was called. error is only non-null if the client was closed by a call to client.close().
    this.client.on('close', error => {
      this.tmiEmitter.emit('close', error);
    });

    // Called when the client becomes ready for the first time (login to the chat server is successful.)
    this.client.on('ready', () => {
      this.tmiEmitter.emit('connected', true);
    });

    // Called when any command is executed by the client.
    this.client.on('rawCommand', cmd => {
      this.tmiEmitter.emit('rawCommand', cmd);
    });

    // Timeout and ban messages
    this.client.on('CLEARCHAT', msg => {
      if (msg.targetUsername) {
        this.tmiEmitter.emit(
          'timeout',
          '#' + msg.channelName,
          msg.targetUsername,
          'timeout',
          msg.banDuration,
          msg
        );
      } else {
        this.tmiEmitter.emit('clearchat', '#' + msg.channelName);
      }
    });

    // Single message deletions (initiated by /delete)
    this.client.on('CLEARMSG', clearmsgMessage => {
      this.tmiEmitter.emit('clearmsg', clearmsgMessage);
    });

    // A channel entering or exiting host mode.
    this.client.on('HOSTTARGET', hosttargetMessage => {
      this.tmiEmitter.emit('host', hosttargetMessage);
    });

    // Various notices, such as when you /help, a command fails,
    // the error response when you are timed out, etc.
    this.client.on('NOTICE', msg => {
      this.tmiEmitter.emit('notice', '#' + msg.channelName, msg.messageID, msg?.messageText ?? '');
    });

    // A change to a channel's followers mode, subscribers-only mode,
    // r9k mode, followers mode, slow mode etc.
    this.client.on('ROOMSTATE', roomstateMessage => {
      this.tmiEmitter.emit('roomstate', roomstateMessage);
    });

    // Subs, resubs, sub gifts, rituals, raids, etc.
    this.client.on('USERNOTICE', usernoticeMessage => {
      this.tmiEmitter.emit('usernotice', usernoticeMessage);
    });

    // Your own state (e.g. badges, color, display name, emote
    // sets, mod status), sent on every time you join a channel or
    // send a PRIVMSG to a channel
    this.client.on('USERSTATE', userstateMessage => {
      this.tmiEmitter.emit('userstate', userstateMessage);
    });

    // Logged in user's "global state", sent once on every login
    // (Note that due to the used connection pool you can receive
    // this multiple times during your bot's runtime)
    this.client.on('GLOBALUSERSTATE', globaluserstateMessage => {
      this.tmiEmitter.emit('globaluserstate', globaluserstateMessage);
    });

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

    this.client.on('JOIN', joinMessage => {
      this.tmiEmitter.emit('join', joinMessage);
    });

    this.client.on('PART', partMessage => {
      this.tmiEmitter.emit('part', partMessage);
    });

    this.client.on('CAP', capMessage => {
      this.tmiEmitter.emit('cap', capMessage);
    });
  },

  // join the channel (only for session)
  join(channel) {
    channel = channel.startsWith('#') ? channel : `#${channel}`;

    this.client.join(channel);
  },

  // leave the channel (only for session)
  part(channel) {
    channel = channel.startsWith('#') ? channel : `#${channel}`;

    this.client.part(channel);
  },

  // Post a /me message in the given channel.
  action(channel, message) {
    channel = channel.startsWith('#') ? channel : `#${channel}`;

    this.client.me(channel, message);
  },

  // timeout a user
  timeout(channel, username, length, reason = '') {
    this.client.timeout(channel.replace('#', ''), username, length, reason);
  },

  // ban a user
  ban(channel, username, reason = '') {
    this.client.ban(channel.replace('#', ''), username, reason);
  },

  // whisper user with message
  async whisper(username, message) {
    message = message.replace(/(\r\n|\n|\r)/gm, '');

    await this.client.whisper(username, message);

    await this.service.sqlClient.query(
      `
      INSERT INTO whispers_sent (username, message, date)
      VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [username, message]
    );
  },

  // set self color
  setColor(color) {
    this.client.setColor(color);
  },

  // get mods of the channel
  getMods(channel) {
    return this.client.getMods(channel);
  },

  // get vips of the channel
  getVips(channel) {
    return this.client.getVips(channel);
  },

  // send ping to tmi
  ping() {
    return this.client.ping();
  },

  // Send a raw PRIVMSG to the given channel. You can issue chat commands with
  // this function, e.g. client.privmsg("forsen", "/timeout weeb123 5") or normal
  // messages, e.g. client.privmsg("forsen", "Kappa Keepo PogChamp").
  sayRaw(channel, message) {
    this.client.privmsg(channel, message);
  },

  async say(channel, message) {
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

    // split the message in separate chunks if it exceeds 500 characters
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
};

module.exports.tmiClient = tmiClient;
