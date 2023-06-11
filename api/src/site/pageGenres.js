const fs = require('fs');
const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const pageGenres = services => {
  const { app } = services;

  app.get('/genres', (req, res) => {
    const genres = fs.readFileSync('../data/genres.json');

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/genres.html')
    );

    const page = new utils.Swapper(html, [
      {
        genres,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = pageGenres;
