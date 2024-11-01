const fs = require('fs');
const _ = require('lodash');

const pageGenres = services => {
  const { app, Commons } = services;

  app.get('/genres', (req, res) => {
    const genres = fs.readFileSync('../data/genres.json');

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/genres.html')
    );

    const page = Commons.UtilityRepository().htmlPageCompiler(html, [
      {
        genres,
      },
    ]);

    res.send(page);
  });
};

module.exports = pageGenres;
