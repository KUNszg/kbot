const _ = require('lodash');
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

  /**
   * Retrieves a boolean indicating whether the channel is live and strict.
   * @param {string} channelName - The name of the channel to retrieve.
   * @returns {Promise<boolean|null>} The result if found, otherwise null.
   */
  async isStrictAndLive(channelName) {
    if (channelName) {
      const channels = await this._getByField(
        CommonRepository.table.channels,
        'channel',
        channelName.replace('#', '')
      );

      const firstChannel = _.first(channels);

      return (
        _.get(firstChannel, 'status') === 'live' &&
        _.toLower(_.get(firstChannel, 'strict')) === 'y'
      );
    }

    return null;
  }
}

module.exports = ChannelRepository;
