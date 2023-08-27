const got = require('got');
const creds = require('../../../lib/credentials/config');
const fs = require('fs');
const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const pageLastfmResolved = services => {
  const { app, kb } = services;

  app.get('/lastfmresolved', async (req, res) => {
    if (!_.get(req, 'query.verifcode') || !_.get(req, 'query.user')) {
      res.status(400).send('<body>Error - no verifcode/user provided</body>');
      return;
    }

    const checkIfUserExists = await got(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${req.query.user}&api_key=${creds.lastfmApiKey}&format=json&limit=2`
    ).json();

    if (!_.get(checkIfUserExists, 'user.name')) {
      res.send('<body>This username does not exist on Lastfm.</body>');
      return;
    }

    let html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/lastfmResolve.html')
    );

    const page = new utils.Swapper(html, [
      {
        code: _.get(req, 'query.verifcode'),
      },
    ]);

    try {
      await (async () => {
        res.send(page.template());

        await kb.sqlClient.query(
          `
                UPDATE access_token
                SET access_token=?,
                    refresh_token="lastfm currently playing",
                    platform="lastfm",
                    premium="N",
                    allowlookup="N",
                    scopes="lastfm currently playing"
                WHERE code=?`,
          [req.query.user, req.query.verifcode]
        );
      })();
    } catch (err) {
      if (err.message === 'Response code 400 (Bad Request)') {
        res.send('<body>Your code has expired, repeat the process.</body>');
        return;
      }

      if (err.message === 'no query') {
        res.send('<body>Invalid code.</body>');
      }
    }
  });
};

module.exports = pageLastfmResolved;
