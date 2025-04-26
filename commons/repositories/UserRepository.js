const _ = require('lodash');
const moment = require('moment');

const CommonRepository = require('./CommonRepository');
const got = require('got');
const creds = require('../../lib/credentials/config');

const USER_GLOBAL_COOLDOWN_EXPIRATION_SEC =
  process.env.USER_GLOBAL_COOLDOWN_EXPIRATION_SEC || 5;

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

    this._userActivity = new Map();
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
   * @param {string} [userstate.userId] - The user's ID.
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
   * @param {string} [userstate.userId] - The user's ID.
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
   * @param {string} [userstate.userId] - The user's ID.
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
   * @param {string} [userstate.userId] - The user's ID.
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

  async isUserOnCooldown(command, userstate) {
    const userId = userstate['user-id'];
    const now = Date.now();

    if (this._userActivity.has(userId) && this._userActivity.get(userId).cooldown) {
      return true;
    }

    const activity = this._userActivity.get(userId) || { timestamps: [], cooldown: false };

    activity.timestamps = _.filter(activity.timestamps, timestamp => now - timestamp <= 1000);

    activity.timestamps.push(now);

    if (activity.timestamps.length > 3) {
      activity.cooldown = true;
      this._userActivity.set(userId, activity);

      setTimeout(() => {
        const currentActivity = this._userActivity.get(userId);
        if (currentActivity) {
          currentActivity.cooldown = false;
        }
      }, USER_GLOBAL_COOLDOWN_EXPIRATION_SEC);

      return true;
    }

    this._userActivity.set(userId, activity);

    const globalUserCooldown = await this.serviceConnector.redisClient.get(
      `kb:cooldown:global:${userId}`
    );
    const commandUserCooldown = await this.serviceConnector.redisClient.get(
      `kb:cooldown:local:${command}:${userId}`
    );

    if (globalUserCooldown || commandUserCooldown) {
      return true;
    } else {
      await this.serviceConnector.redisClient.set(
        `kb:cooldown:global:${userId}`,
        1,
        USER_GLOBAL_COOLDOWN_EXPIRATION_SEC
      );

      return false;
    }
  }

  _getOauthAccessToken = async (userId, platform = 'spotify') => {
    if (_.isEmpty(userId)) return null;

    const tokenResults = await this.serviceConnector.sqlClient.query(
      `SELECT access_token AS accessToken, 
              refresh_token AS refreshToken, 
              lastRenew, 
              allowLookup
       FROM access_token
       WHERE platform=? AND user=?`,
      [platform, userId]
    );

    return _.first(tokenResults);
  };

  _fetchAndRefreshSpotifyOauthToken = async refreshToken => {
    return got(`https://accounts.spotify.com/api/token`, {
      method: 'POST',
      searchParams: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_secret: creds.client_secret_spotify || process.client_secret_spotify,
        client_id: creds.client_id_spotify || process.client_id_spotify
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).json();
  };

  _createSpotifyAuthorizedRequester = accessToken => {
    return async (method, endpoint, payload) => {
      return got(`https://api.spotify.com${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        json: payload
      }).json();
    };
  };

  async spotifyFetchWithOauth(method = 'GET', endpoint, userId, isSender = true, payload) {
    const refreshOauthAccessToken = await this._getOauthAccessToken(userId);

    if (!refreshOauthAccessToken) {
      throw new Error('Spotify Oauth token not found');
    }

    let { lastRenew, accessToken, refreshToken, allowLookup } = refreshOauthAccessToken;

    if (allowLookup === 'N' && !isSender) {
      throw new Error('Spotify lookup not allowed');
    }

    if (moment(lastRenew).isBefore(moment().subtract(59, 'minutes'))) {
      const spotifyOauthResult = await this._fetchAndRefreshSpotifyOauthToken(refreshToken);

      if (_.isEmpty(spotifyOauthResult)) {
        throw new Error('Spotify Oauth token could not be refreshed');
      }

      await this.serviceConnector.sqlClient.query(
        `UPDATE access_token
         SET access_token=?,
            scopes=?,
            lastRenew=?
         WHERE platform="spotify" AND user=?`,
        [
          spotifyOauthResult.access_token,
          spotifyOauthResult.scope,
          moment().format('YYYY-MM-DD HH:mm:ss'),
          userId
        ]
      );

      accessToken = spotifyOauthResult.access_token;
    }

    const spotifyRequest = this._createSpotifyAuthorizedRequester(accessToken);

    let isPremium;
    let profileResponse;

    try {
      profileResponse = await spotifyRequest('GET', '/v1/me');
      isPremium = _.get(profileResponse, 'product') === 'open' ? 'N' : 'Y';

      await this.serviceConnector.sqlClient.query(
        `UPDATE access_token
         SET premium=?, lastRenew = CURRENT_DATE()
         WHERE platform="spotify" AND user=?`,
        [isPremium, userId]
      );
    } catch (err) {
      const error = JSON.parse(err.response.body);

      if (
        error.error === 'invalid_grant' &&
        error.error_description === 'Refresh token revoked'
      ) {
        await this.serviceConnector.sqlClient.query(
          `DELETE FROM access_token
           WHERE platform="spotify" AND user=?`,
          [userId]
        );
      }
    }

    let endpointResponse = null;

    if (!!endpoint) {
      endpointResponse = await spotifyRequest(method, endpoint, payload);
    }

    return {
      spotifyUser: {
        lastRenew,
        accessToken,
        refreshToken,
        allowLookup,
        isPremium: isPremium === 'Y'
      },
      profileResponse,
      endpointResponse
    };
  }
}

module.exports = UserRepository;
