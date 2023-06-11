const fs = require('fs');
const utils = require('../../../lib/utils/utils');
const _ = require('lodash');

const createColorsGetResponse = require('../../utils/createColorsGetResponse');

const colorsGet = services => {
  const { app, kb, redisClient } = services;

  app.get('/colors', async (req, res) => {
    const html = _.toString(
      fs.readFileSync('../../kbot-website/html/express_pages/colors.html')
    );

    let colors;

    const stats = await redisClient.get('kb:api:colors:stats');

    if (!stats) {
      const colorsData = await kb.query(`
        SELECT color, COUNT(*) AS count
        FROM user_list
        GROUP BY color
        HAVING count >= 100
        ORDER BY count DESC
        LIMIT 100`);

      colors = createColorsGetResponse(colorsData);

      await redisClient.set('kb:api:colors:stats', colors, 10800);
    } else {
      colors = stats;
    }

    const page = new utils.Swapper(html, [
      {
        colors: colors,
      },
    ]);

    res.send(page.template());
  });
};

module.exports = colorsGet;
