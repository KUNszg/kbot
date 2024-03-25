const Discord = require('discord.js');
const { discordConfig } = require('../consts/serviceConfigs');

const discordClient = {
  connect: async function () {
    this.native = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });

    await this.native.login(discordConfig.discordLogin);

    global.discordClient = this.native;

    console.log('Discord connected');
  },
};

module.exports.discordClient = discordClient;
