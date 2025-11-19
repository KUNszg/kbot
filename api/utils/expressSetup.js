const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const expressSetup = (app, webhookHandler, sqlClient) => {
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  });

  app.enable('trust proxy');
  app.set('trust proxy', 1);

  app.use('/api/', apiLimiter);

  app.use(async function (req, res, next) {
    await sqlClient.query(
      `
      INSERT INTO web_connections (url, method, protocol, route, userAgent, date)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [req.originalUrl, req.method, req.protocol, 'API', req.headers['user-agent']]
    );
    next();
  });

  app.use(bodyParser.json());
  app.use(webhookHandler);
};

module.exports = expressSetup;
