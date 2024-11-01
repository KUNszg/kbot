const Commons = require('../../commons/Commons');

const handleGithubWebhookMessage = require('../utils/handleGithubWebhookMessage');

const webhookHandlerWildcard = services => {
  const { Commons, webhookHandler } = services;

  const kb = Commons.ServiceConnector.Connector;

  webhookHandler.on('*', async function (event, repo, data, head) {
    kb.websocketClient.websocketEmitter.emit('wsl', {
      type: 'github',
      data: [{ event }, { repo }, { data }, { head }],
    });

    const githubWebhookTwitchResponse = await handleGithubWebhookMessage(
      { kb },
      event,
      repo,
      data
    );

    if (githubWebhookTwitchResponse) {
      await kb.tmiClient.say(
        Commons.CommonRepository.botUsername,
        githubWebhookTwitchResponse
      );
    }
  });
};

module.exports = webhookHandlerWildcard;
