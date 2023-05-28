const fs = require('fs');
const _ = require('lodash');

const pageCommandsCodeRedirect = services => {
  const { app } = services;

  app.get('/commands/code', async (req, res) => {
    res.send(
      _.toString(
        fs.readFileSync('../../kbot-website/html/express_pages/commandCodeRedirect.html')
      )
    );
  });
};

module.exports = pageCommandsCodeRedirect;
