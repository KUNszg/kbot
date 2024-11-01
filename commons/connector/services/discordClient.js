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
        console.log('Discord connected');
      });

      this.client.on('error', error => {
        console.error('Discord client error:', error);
        this.isConnected = false;
      });

      try {
        await this.client.login(discordConfig.discordLogin);
        DiscordClient.instance.native = this.client;
      } catch (error) {
        console.error('Discord connection error:', error);
        this.isConnected = false;
      }
    }

    return this.client;
  }
}

module.exports = {
  discordClient: new DiscordClient(),
};
