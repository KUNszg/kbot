const express = require('express');
const requireDir = require('require-dir');
const _ = require('lodash');

const Commons = require('../commons/Commons');
const { startHeartbeat } = require('../commons/connector/utils/heartbeat');

const expressSetup = require('./utils/expressSetup');
const initializeMethodRecurse = require('./utils/initializeMethodRecurse');
const GithubWebHook = require('./utils/gitWebhookMiddleware');

const creds = require('../lib/credentials/config');

const serviceSettings = require('../consts/serviceSettings.json');

const service = serviceSettings.services.api;

const app = express();

const secret = creds.webhook_github_secret;
const webhookHandler = GithubWebHook({ path: '/webhooks/github', secret: secret });

(async () => {
  const kb = await Commons.ServiceConnector.Connector.dependencies(
    ['sql', 'tmi', 'rabbit', 'redis', 'rabbit'],
    {
      enableHealthcheck: true,
      service,
      disableTMIAutojoin: true
    }
  );

  startHeartbeat(kb, 'kbot-api');

  expressSetup(app, webhookHandler, kb.sqlClient);

  const endpoints = requireDir('src', {
    recurse: true,
    extensions: ['.js']
  });

  _.forEach(endpoints, invocation => {
    initializeMethodRecurse(invocation, {
      Commons,
      app,
      webhookHandler
    });
  });

  app.listen(8080, '0.0.0.0');
})();
