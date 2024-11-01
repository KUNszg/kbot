const fs = require('fs');
const _ = require('lodash');

const pageLastfm = services => {
  const { app, Commons } = services;

  const kb = Commons.ServiceConnector.Connector;

  app.get('/lastfm', async (req, res) => {
    if (!_.get(req, 'query.code')) {
      res.status(400).send('<body>Error - no verifcode/user provided</body>');
      return;
    }

    let verifCode = Commons.UtilityRepository().stringGenerator();

    while (await kb.redisClient.get(`kb:site:lastfm:code:${verifCode}`)) {
      verifCode = Commons.UtilityRepository().stringGenerator();
    }

    await kb.redisClient.set(`kb:site:lastfm:code:${verifCode}`);

    await kb.sqlClient.query(
      `
        INSERT INTO access_token (code)
        VALUES (?)`,
      [verifCode]
    );

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/lastfm.html')
    );

    const page = Commons.UtilityRepository().htmlPageCompiler(html, [
      {
        code: verifCode,
      },
    ]);

    res.send(page);
  });
};

module.exports = pageLastfm;
