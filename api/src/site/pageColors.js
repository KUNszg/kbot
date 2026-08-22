const fs = require('fs');
const _ = require('lodash');

const createColorsGetResponse = require('../../utils/createColorsGetResponse');

const pageColors = services => {
  const { app, Commons } = services;

  const kb = Commons.ServiceConnector.Connector;

  app.get('/colors', async (req, res) => {
    res.send('Page is under maintenance.');
    return;

    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/colors.html')
    );

    let colors;

    const stats = await kb.redisClient.get('kb:api:colors:stats');

    if (!stats) {
      const colorsData = await kb.sqlClient.query(`
        SELECT color, COUNT(*) AS count
        FROM user_list
        GROUP BY color
        HAVING count >= 100
        ORDER BY count DESC
        LIMIT 100`);

      colors = createColorsGetResponse(colorsData);

      await kb.redisClient.set('kb:api:colors:stats', colors, 10800);
    } else {
      colors = stats;
    }

    const page = Commons.UtilityRepository().complementHtmlPageTemplates(html, [
      {
        colors
      }
    ]);

    res.send(page);
  });
};

module.exports = pageColors;
