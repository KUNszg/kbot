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
        console.log('Reddit connected');
      } catch (error) {
        console.error('Reddit connection error:', error);
        this.isConnected = false;
        this.client = null;
      }
    }

    return this.client;
  }
}

module.exports = {
  redditClient: new RedditClient(),
};
