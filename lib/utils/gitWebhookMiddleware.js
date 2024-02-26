'use strict';

const EventEmitter = require('events').EventEmitter;
const crypto = require('crypto');
const bufferEq = require('buffer-equal-constant-time');

function signData(secret, data) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifySignature(secret, data, signature, signData) {
  return bufferEq(new Buffer(signature), new Buffer(signData(secret, data)));
}

const GithubWebhook = function (options) {
  options.secret = options.secret || '';
  options.deliveryHeader = options.deliveryHeader || 'x-github-delivery';
  options.eventHeader = options.eventHeader || 'x-github-event';
  options.signatureHeader = options.signatureHeader || 'x-hub-signature-256';
  options.signData = options.signData || signData;

  // Make handler able to emit events
  Object.assign(githookHandler, EventEmitter.prototype);
  EventEmitter.call(githookHandler);

  return githookHandler;

  function githookHandler(req, res, next) {
    if (req.method !== 'POST' || req.url.split('?').shift() !== options.path) {
      return next();
    }

    function reportError(message) {
      // respond error to sender
      res.status(400).send({
        error: message,
      });

      // emit error
      githookHandler.emit('error', new Error(message), req, res);
    }

    // check header fields
    let id = req.headers[options.deliveryHeader];
    if (!id) {
      return reportError('Failed to verify signature');
    }

    let event = req.headers[options.eventHeader];
    if (!event) {
      return reportError('Failed to verify signature');
    }

    let sign = req.headers[options.signatureHeader] || '';
    if (options.secret && !sign) {
      return reportError('Failed to verify signature');
    }

    // verify signature (if any)
    if (
      options.secret &&
      !verifySignature(options.secret, JSON.stringify(req.body), sign, options.signData)
    ) {
      return reportError('Failed to verify signature');
    }

    // parse payload
    let payloadData = req.body;
    let headers = req.headers;
    const repo = payloadData.repository && payloadData.repository.name;

    // emit events
    githookHandler.emit('*', event, repo, payloadData, headers);
    githookHandler.emit(event, repo, payloadData, headers);
    if (repo) {
      githookHandler.emit(repo, event, payloadData, headers);
    }

    res.status(200).send('OK');
  }
};

module.exports = GithubWebhook;
