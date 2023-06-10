#!/usr/bin/env node

const express = require('express');
const requireDir = require('require-dir');
const _ = require('lodash');

const creds = require('../lib/credentials/config');
const init = require('../lib/utils/connection');

const GithubWebHook = require('../lib/utils/git-webhook-middleware');
const expressSetup = require('./utils/expressSetup');
const initializeMethodRecurse = require('./utils/initializeMethodRecurse');

const app = express();

const kb = new init.IRC();
const redisClient = init.Redis;

const secret = creds.webhook_github_secret;
const webhookHandler = GithubWebHook({ path: '/webhooks/github', secret: secret });

expressSetup(app, webhookHandler);

const endpoints = requireDir('src', { recurse: true, extensions: ['.js'] });

(async () => {
  await kb.tmiConnect();
  await kb.sqlConnect();
  await redisClient.connect();

  _.forEach(endpoints, invocation => {
    initializeMethodRecurse(invocation, { kb, redisClient, app, webhookHandler });
  });

  app.listen(process.env.PORT || 8080, '0.0.0.0');
})();

const statusCheck = async () => {
  await kb.query(
    `
		UPDATE stats
		SET date=?
		WHERE type="module" AND sha="api"`,
    [new Date().toISOString().slice(0, 19).replace('T', ' ')]
  );
};

statusCheck();
setInterval(statusCheck, 60000);
