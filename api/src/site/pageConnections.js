const fs = require('fs');
const _ = require('lodash');

const pageConnections = services => {
  const { app, Commons } = services;

  const kb = Commons.ServiceConnector.Connector;

  app.get('/connections', async (req, res) => {
    const [commandExecutionsCount, spotifyAndLastfmUserLoggedInCount] = await kb
      .multi()
      .get('kb:api:website-pages:command-executions-count')
      .get('kb:api:website-pages:spotify-and-lastfm-user-logged-in-count')
      .exec();

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/connections.html')
    );

    const page = Commons.UtilityRepository().complementHtmlPageTemplates(html, [
      {
        execs: commandExecutionsCount,
        users: spotifyAndLastfmUserLoggedInCount
      }
    ]);

    res.send(page);
  });
};

module.exports = pageConnections;
