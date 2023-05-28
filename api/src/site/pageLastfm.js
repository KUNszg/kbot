const utils = require('../../../lib/utils/utils');
const fs = require('fs');
const _ = require('lodash');

const pageLastfm = services => {
  const { app, kb, redisClient } = services;

  app.get('/lastfm', async (req, res) => {
    if (!_.get(req, 'query.code')) {
      res.status(400).send('<body>Error - no verifcode/user provided</body>');
      return;
    }

    let verifCode = utils.genString();

    while ((await redisClient.get(`kb:site:lastfm:code:${verifCode}`))) {
      verifCode = utils.genString();
    }

    await redisClient.set(`kb:site:lastfm:code:${verifCode}`)

    await kb.query(
      `
        INSERT INTO access_token (code)
        VALUES (?)`,
      [verifCode]
    );

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/lastfm.html')
    );

    const page = new utils.Swapper(html, [
      {
        code: verifCode,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageLastfm;
