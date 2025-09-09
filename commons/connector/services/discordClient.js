const Discord = require('discord.js');
const { discordConfig } = require('../consts/serviceConfigs');

/**
 * Singleton class for managing Discord bot connections.
 */
class DiscordClient {
  constructor() {
    if (!DiscordClient.instance) {
      DiscordClient.instance = this;
      this.client = null;
      this.isConnected = false;
    }

    return DiscordClient.instance;
  }

  /**
   * Establishes a connection to the Discord bot.
   * If a connection already exists, it returns the existing connection.
   * @returns {Promise<Discord.Client>} The Discord client instance.
   * @throws {Error} If there is an error establishing the connection.
   */
  async connect() {
    if (!this.client) {
      this.client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });

      this.client.once('ready', () => {
        this.isConnected = true;
        console.log('[Connector-Discord] Connected');
      });

      this.client.on('error', error => {
        console.error('[Connector-Discord] Client error:', error);
        this.isConnected = false;
      });

      try {
        await this.client.login(discordConfig.discordLogin);
        DiscordClient.instance.native = this.client;
      } catch (error) {
        console.error('[Connector-Discord] Connection error:', error);
        this.isConnected = false;
      }
    }

    return this.client;
  }

  async close() {
    if (this.client) {
      console.log('[Connector-Discord] Closing connection...');
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
      console.log('[Connector-Discord] Connection closed');
    }
  }
}

module.exports = {
  discordClient: new DiscordClient()
};
