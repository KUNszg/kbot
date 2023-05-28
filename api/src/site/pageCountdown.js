const utils = require('../../../lib/utils/utils');
const fs = require('fs');
const _ = require('lodash');

const pageCountdown = services => {
  const { app, kb } = services;

  app.get('/countdown', async (req, res) => {
    try {
      if (!_.get(req, 'query.verifcode')) {
        const verifCode = utils.genString();

        const html = _.toString(
          fs.readFileSync('../../kbot-website/html/express_pages/countdownAlternative.html')
        );

        const page = new utils.Swapper(html, [
          {
            verifCode,
          },
        ]);

        await kb.query(
          `
                INSERT INTO countdown (verifcode, date)
                VALUES (?, CURRENT_TIMESTAMP)`,
          [verifCode]
        );

        res.send(page.template());
        return;
      }

      if (!_.get(req, 'query.seconds')) {
        req.query.seconds = 120;
      }

      const checkIfUpdated = await kb.query(
        `
            SELECT *
            FROM countdown
            WHERE verifcode=?`,
        [req.query.verifcode]
      );

      if (!checkIfUpdated.length) {
        res.send(
          '<body>Combination not found, refresh the previous page and try again</body>'
        );
        return;
      }

      if (_.get(checkIfUpdated, '0.seconds') === null) {
        await kb.query(
          `
                UPDATE countdown SET seconds=?
                WHERE verifcode=?`,
          [Date.now() / 1000 + Number(req.query.seconds), req.query.verifcode]
        );
      }

      const seconds = await kb.query(
        `
            SELECT *
            FROM countdown
            WHERE verifcode=?`,
        [req.query.verifcode]
      );

      let html = _.toString(
        fs.readFileSync('../../kbot-website/html/express_pages/countdown.html')
      );

      const page = new utils.Swapper(html, [
        {
          seconds: seconds[0].seconds,
          code: req.query.verifcode,
          secValue: req.query.seconds,
          stringLength:
            `https://kunszg.com/countdown?seconds=${req.query.seconds}&verifCode=${req.query.verifcode}`
              .length + 8,
        },
      ]);

      res.send(page.template());
    } catch (err) {
      console.log(err);
    }
  });
};

module.exports = pageCountdown;
