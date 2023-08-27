const snoowrap = require('snoowrap');
const { redditConfig } = require('../consts/serviceConfigs');

const redditClient = {
  connect: async function () {
    this.native = new snoowrap(redditConfig);

    global.redditClient = this.native;
  },
};

module.exports.redditClient = redditClient;