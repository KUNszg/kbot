const _ = require('lodash');
const got = require('got');

const CommonRepository = require('./CommonRepository');

let instance = null;

/**
 * ChannelRepository class provides methods to interact with channel-related data in the database.
 * Extends the CommonRepository class.
 */
class ChannelRepository extends CommonRepository {
  /**
   * Creates an instance of ChannelRepository.
   * @param {Object} serviceConnector - Client connection manager.
   */
  constructor(serviceConnector = {}) {
    super(serviceConnector);
  }

  /**
   * Returns the singleton instance of ChannelRepository.
   * If an instance does not exist, it creates one using the provided serviceConnector.
   * @param {Object} serviceConnector - Client connection manager.
   * @returns {ChannelRepository} The singleton instance of ChannelRepository.
   */
  static getInstance(serviceConnector) {
    if (!instance) {
      instance = new ChannelRepository(serviceConnector);
    }
    return instance;
  }

  /**
   * Retrieves channel data based on the provided channel name.
   * @param {string} channelName - The name of the channel to retrieve.
   * @returns {Promise<Object|null>} The channel data if found, otherwise null.
   */
  async channel(channelName) {
    if (channelName) {
      return await this._getByField(
        CommonRepository.table.channels,
        'channel',
        channelName.replace('#', '')
      );
    }

    return null;
  }

  async isMasspingInText(channelName, text) {
    const chatters = await this.serviceConnector.redisClient.get(
      `kb:channel:${channelName}:chatters`
    );

    if (_.isEmpty(chatters)) {
      return false;
    }

    const normalizedText = _.toLower(text);
    const mentionRegex = /\b(@?[a-zA-Z0-9_]+)\b/g;

    let mentions = [];
    let match;

    while ((match = mentionRegex.exec(normalizedText)) !== null) {
      mentions.push(_.toLower(_.replace(match[1], /[^a-zA-Z0-9_]/g, '')));
    }

    const normalizedChatters = _.map(chatters, _.toLower);
    const massPinged = _.intersection(mentions, normalizedChatters);

    return massPinged.length >= 3;
  }

  async checkBanphraseInText(channelName, text) {
    const data = await this.serviceConnector.sqlClient.query(
      `
      SELECT *
      FROM channel_banphrase_apis
      WHERE channel=? AND status=?`,
      [channelName, 'enabled']
    );

    if (!_.size(data)) {
      return { banned: false };
    }

    return got(encodeURI(_.get(_.first(data), 'url')), {
      method: 'POST',
      body: `message=${encodeURIComponent(text)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).json();
  }
}

module.exports = ChannelRepository;
