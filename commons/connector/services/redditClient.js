const snoowrap = require('snoowrap');
const { redditConfig } = require('../consts/serviceConfigs');

/**
 * Singleton class for managing Reddit API connections.
 */
class RedditClient {
  constructor() {
    if (!RedditClient.instance) {
      RedditClient.instance = this;
      this.client = null;
      this.isConnected = false;
    }

    return RedditClient.instance;
  }

  /**
   * Establishes a connection to the Reddit API.
   * If a connection already exists, it returns the existing connection.
   * @returns {snoowrap} The Reddit client instance.
   */
  async connect() {
    if (!this.client) {
      this.client = new snoowrap(redditConfig);
      RedditClient.instance.native = this.client;

      try {
        await this.client.getMe();
        this.isConnected = true;
        console.log('[Connector-Reddit] Connected');
      } catch (error) {
        console.error('[Connector-Reddit] Connection error:', error);
        this.isConnected = false;
        this.client = null;
      }
    }

    return this.client;
  }

  async close() {
    if (this.client) {
      console.log('[Connector-Reddit] Closing connection...');
      this.client = null;
      this.isConnected = false;
      console.log('[Connector-Reddit] Connection closed');
    }
  }
}

module.exports = {
  redditClient: new RedditClient()
};
