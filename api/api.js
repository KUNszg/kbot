const express = require('express');
const requireDir = require('require-dir');
const _ = require('lodash');

const serviceConnector = require('../connector/serviceConnector');

const expressSetup = require('./utils/expressSetup');
const initializeMethodRecurse = require('./utils/initializeMethodRecurse');

const creds = require('../lib/credentials/config');
const GithubWebHook = require('../lib/utils/gitWebhookMiddleware');

const serviceSettings = require("../consts/serviceSettings.json");

const service = serviceSettings.services.api;

const app = express();

const secret = creds.webhook_github_secret;
const webhookHandler = GithubWebHook({ path: '/webhooks/github', secret: secret });

expressSetup(app, webhookHandler);

const endpoints = requireDir('src', {
  recurse: true,
  extensions: ['.js'],
  filter: function (fullPath) {
    return process.env.NODE_ENV !== 'production' && !fullPath.match(/$dev/);
  },
});

(async () => {
  const kb = await serviceConnector.Connector.dependencies(['tmi', 'sql', 'redis', 'rabbit'], {
    enableHealthcheck: true,
    service
  });

  _.forEach(endpoints, invocation => {
    initializeMethodRecurse(invocation, {
      kb,
      redisClient: kb.redisClient,
      app,
      webhookHandler,
    });
  });

  app.listen(8080, '0.0.0.0');
})();
