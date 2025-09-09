const fs = require('fs');
const _ = require('lodash');

const pageCommandsCode = services => {
  const { app, Commons } = services;

  app.get('/commands/code/:commandName', async (req, res) => {
    const query = req.params.commandName;

    if (query) {
      try {
        const requestedFile = fs.readFileSync(`../lib/commands/${query}.js`);

        let html = _.toString(
          fs.readFileSync('../../kbot-website/html/express_pages/commandCode.html')
        );

        const page = Commons.UtilityRepository().complementHtmlPageTemplates(html, [
          {
            requestedFile,
            query
          }
        ]);

        res.send(page);
      } catch (err) {
        res.send('<h3>Error: command not found</h3>');
      }
    } else {
      res.send('<h3>Error: command not found</h3>');
    }
  });
};

module.exports = pageCommandsCode;
