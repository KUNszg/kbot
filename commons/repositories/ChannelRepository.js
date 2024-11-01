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
   * @param {Object} sqlClient - An SQL client instance for executing queries.
   * @throws Will throw an error if no sqlClient is provided.
   */
  constructor(sqlClient) {
    if (!sqlClient) {
      throw new Error('no sqlClient provided');
    }

    super(sqlClient);
  }

  /**
   * Returns the singleton instance of ChannelRepository.
   * If an instance does not exist, it creates one using the provided sqlClient.
   * @param {Object} sqlClient - An SQL client instance for executing queries.
   * @returns {ChannelRepository} The singleton instance of ChannelRepository.
   */
  static getInstance(sqlClient) {
    if (!instance) {
      instance = new ChannelRepository(sqlClient);
    }
    return instance;
  }

  /**
   * Retrieves channel data based on the provided channel name.
   * @param {string} channelName - The name of the channel to retrieve.
   * @returns {Promise<Object|null>} The channel data if found, otherwise null.
   */
  channel(channelName) {
    if (channelName) {
      return this._getByField(
        CommonRepository.table.channels,
        'channel',
        channelName.replace('#', '')
      );
    }

    return null;
  }
}

module.exports = ChannelRepository;
