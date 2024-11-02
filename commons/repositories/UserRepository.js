const CommonRepository = require('./CommonRepository');

let instance = null;

/**
 * UserRepository class provides methods to interact with user-related data in the database.
 * It includes functionality for retrieving user data, checking if a user is banned, and more.
 * Extends the CommonRepository class.
 */
class UserRepository extends CommonRepository {
  /**
   * Creates an instance of UserRepository.
   * @param {Object} serviceConnector - Client connection manager.
   */
  constructor(serviceConnector = {}) {
    super(serviceConnector);
  }

  /**
   * Returns the singleton instance of UserRepository.
   * If an instance does not exist, it creates one using the provided serviceConnector.
   * @param {Object} serviceConnector - Client connection manager.
   * @returns {UserRepository} The singleton instance of UserRepository.
   */
  static getInstance(serviceConnector) {
    if (!instance) {
      instance = new UserRepository(serviceConnector);
    }
    return instance;
  }

  /**
   * Retrieves user data based on the provided user state.
   * @param {Object} userstate - The user state object containing user details.
   * @param {string} [userstate.user-id] - The user's ID.
   * @param {string} [userstate.username] - The user's username.
   * @returns {Promise<Object|null>} The user data if found, otherwise null.
   */
  async getUser(userstate) {
    const { userId, username } = this._extractUserIdentifiers(userstate);

    if (userId) {
      return await this._getByField(CommonRepository.table.user_list, 'userId', userId);
    } else if (username) {
      return await this._getByField(CommonRepository.table.user_list, 'username', username);
    }

    return null;
  }

  /**
   * Retrieves the bot owner's data.
   * @returns {Promise<Object>} The bot owner's data.
   */
  async getBotOwner() {
    return await this.serviceConnector.sqlClient.query(
      `
      SELECT *
      FROM trusted_users
      WHERE ID=?`,
      [UserRepository.botOwnerId]
    );
  }

  /**
   * Checks if the user is banned based on the provided user state.
   * @param {Object} userstate - The user state object containing user details.
   * @param {string} [userstate.user-id] - The user's ID.
   * @param {string} [userstate.username] - The user's username.
   * @returns {Promise<boolean>} True if the user is banned, otherwise false.
   */
  async isUserBanned(userstate) {
    let isBanned = null;

    const { userId, username } = this._extractUserIdentifiers(userstate);

    if (userId) {
      isBanned = await this._exists(CommonRepository.table.ban_list, { user_id: userId });
    } else if (username) {
      isBanned = await this._exists(CommonRepository.table.ban_list, { username });
    }

    return isBanned;
  }

  /**
   * Checks if the user is mention-banned based on the provided user state.
   * @param {Object} userstate - The user state object containing user details.
   * @param {string} [userstate.user-id] - The user's ID.
   * @param {string} [userstate.username] - The user's username.
   * @returns {Promise<boolean>} True if the user is mention-banned, otherwise false.
   */
  async isUserMentionBanned(userstate) {
    let isBanned = null;

    const { userId, username } = this._extractUserIdentifiers(userstate);

    if (userId) {
      isBanned = await this._exists(CommonRepository.table.mention_bans, { user_id: userId });
    } else if (username) {
      isBanned = await this._exists(CommonRepository.table.mention_bans, { username });
    }

    return isBanned;
  }

  /**
   * Checks if the user has opted out of a specific command based on the provided user state.
   * @param {string} command - The command to check.
   * @param {Object} userstate - The user state object containing user details.
   * @param {string} [userstate.user-id] - The user's ID.
   * @param {string} [userstate.username] - The user's username.
   * @returns {Promise<boolean>} True if the user has opted out, otherwise false.
   */
  async isUserOptedOut(command, userstate) {
    let isOptedOut = null;

    const { userId, username } = this._extractUserIdentifiers(userstate);

    if (userId) {
      isOptedOut = await this._exists(CommonRepository.table.optout, { command, userId });
    } else if (username) {
      isOptedOut = await this._exists(CommonRepository.table.optout, { command, username });
    }

    return isOptedOut;
  }
}

module.exports = UserRepository;
