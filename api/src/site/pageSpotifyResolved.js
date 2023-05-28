const utils = require('../../../lib/utils/utils');
const creds = require('../../../lib/credentials/config');
const got = require('got');
const fs = require('fs');
const _ = require('lodash');
const pageSpotifyResolved = services => {
  const { app, kb } = services;

  app.get('/resolved', async (req, res) => {
    if (!_.get(req, 'query.code')) {
      res.status(400).send('<body>Error - no verifcode/user provided</body>');
      return;
    }

    const verifCode = utils.genString();

    try {
      await (async () => {
        const api = `https://accounts.spotify.com/api/token?grant_type=authorization_code&client_id=0a53ae5438f24d0da272a2e663c615c3&client_secret=${creds.client_secret_spotify}&code=${req.query.code}&redirect_uri=https://kunszg.com/resolved`;
        const spotifyToken = await got(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).json();

        const profile = await got(`https://api.spotify.com/v1/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${spotifyToken.access_token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).json();

        await kb.query(
          `
                INSERT INTO access_token (access_token, refresh_token, premium, code, platform)
                VALUES (?, ?, ?, ?, "spotify")`,
          [
            spotifyToken.access_token,
            spotifyToken.refresh_token,
            profile.product === 'open' ? 'N' : 'Y',
            verifCode,
          ]
        );
      })();
    } catch (err) {
      if (err.message === 'Response code 400 (Bad Request)') {
        res.send('<body>Your code has expired, repeat the process.</body>');
      }
    }

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/spotifyResolve.html')
    );

    const page = new utils.Swapper(html, [
      {
        code: verifCode,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageSpotifyResolved;
