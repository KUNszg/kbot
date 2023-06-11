const fs = require('fs');
const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const pageConnections = services => {
  const { app, redisClient } = services;

  app.get('/connections', async (req, res) => {
    const [commandExecutionsCount, spotifyAndLastfmUserLoggedInCount] = await redisClient
      .multi()
      .get('kb:api:website-pages:command-executions-count')
      .get('kb:api:website-pages:spotify-and-lastfm-user-logged-in-count')
      .exec();

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/connections.html')
    );

    const page = new utils.Swapper(html, [
      {
        execs: commandExecutionsCount,
        users: spotifyAndLastfmUserLoggedInCount,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageConnections;
