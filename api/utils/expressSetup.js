const rateLimit = require('express-rate-limit');
const utils = require('../../lib/utils/utils');
const bodyParser = require('body-parser');

const expressSetup = (app, webhookHandler) => {
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  });

  app.enable('trust proxy');
  app.set('trust proxy', 1);

  app.use('/api/', apiLimiter);

  app.use(async function (req, res, next) {
    await utils.conLog(req);
    next();
  });

  app.use(bodyParser.json());
  app.use(webhookHandler);
};

module.exports = expressSetup;
