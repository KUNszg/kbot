const utils = require('../../lib/utils/utils');
const handleGithubWebhookMessage = require('../utils/handleGithubWebhookMessage');

const webhookHandlerWildcard = services => {
  const { redisClient, kb, webhookHandler } = services;

  webhookHandler.on('*', async function (event, repo, data, head) {
    new utils.WSocket('wsl').emit({
      type: 'github',
      data: [{ event }, { repo }, { data }, { head }],
    });

    const githubWebhookTwitchResponse = await handleGithubWebhookMessage(
      { kb, redisClient },
      event,
      repo,
      data
    );

    if (githubWebhookTwitchResponse) {
      kb.say(utils.Get.userData.botUsername, githubWebhookTwitchResponse);
    }
  });
};

module.exports = webhookHandlerWildcard;
