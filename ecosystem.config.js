module.exports = {
  apps: [
    {
      name: 'website',
      script: 'node_modules/next/dist/bin/next',
      args: ['build', 'start -p 31900'],
      watch: false,
      time: true,
    },
    {
      name: 'api',
      script: 'api/api.js',
      watch: false,
      time: true,
    },
    {
      name: 'emote-checker',
      script: 'lib/mirrors/emote-checker/updateEmoteList.js',
      watch: false,
      time: true,
    },
    {
      name: 'reddit-live-thread-to-discord',
      script: 'lib/mirrors/reddit-live-thread-to-discord/redditLiveThreadToDiscord.js',
      watch: false,
      time: true,
    },
    {
      name: 'twitch-chat-message-logger',
      script: 'lib/mirrors/twitch-chat-logger/twitchChatMessageLogger.js',
      watch: false,
      time: true,
    },
    {
      name: 'twitch-chat-queue-filler',
      script: 'lib/mirrors/twitch-chat-logger/twitchChatQueueFiller.js',
      watch: false,
      time: true,
    },
    {
      name: 'twitch-chat-banphrased-message-logger',
      script: 'lib/mirrors/twitch-chat-logger/twitchChatBanphrasedMessageLogger.js',
      watch: false,
      time: true,
    },
    {
      name: 'task-manager',
      script: 'lib/misc/taskManager.js',
      watch: false,
      time: true,
    },
    {
      name: 'command-manager',
      script: 'lib/commandManager',
      watch: false,
      time: true,
    },
  ],
};
