#!/usr/bin/env node

const express = require('express');
const requireDir = require('require-dir');
const _ = require('lodash');
const moment = require('moment/moment');

const serviceConnector = require('../connector/serviceConnector');

const expressSetup = require('./utils/expressSetup');
const initializeMethodRecurse = require('./utils/initializeMethodRecurse');

const creds = require('../lib/credentials/config');

const GithubWebHook = require('../lib/utils/git-webhook-middleware');

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
  const kb = await serviceConnector.Connector.dependencies(['tmi', 'sql', 'redis', 'rabbit']);

  _.forEach(endpoints, invocation => {
    initializeMethodRecurse(invocation, {
      kb,
      redisClient: kb.redisClient,
      app,
      webhookHandler,
    });
  });

  app.listen(process.env.PORT || 8080, '0.0.0.0');

  const statusCheck = async () => {
    await kb.query(
      `
		UPDATE stats
		SET date=?
		WHERE type="module" AND sha="api"`,
      [moment().format('YYYY-MM-DD hh:mm:ss')]
    );

    setTimeout(statusCheck, 60000);
  };
})();
