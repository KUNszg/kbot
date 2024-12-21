if (process.env.APP_NAME === "UPDATE_EMOTES_LIST") {
  require("./emote-checker/updateEmotesList")
}

if (process.env.APP_NAME === "REDDIT_LIVE_THREAD_TO_DISCORD") {
  require("./reddit-live-thread-to-discord/redditLiveThreadToDiscord")
}

if (process.env.APP_NAME === "TWITCH_CHAT_BANPHRASED_MESSAGE_LOGGER") {
  require("./twitch-chat-logger/twitchChatBanphrasedMessageLogger")
}

if (process.env.APP_NAME === "TWITCH_CHAT_MESSAGE_LOGGER") {
  require("./twitch-chat-logger/twitchChatMessageLogger")
}

if (process.env.APP_NAME === "TWITCH_CHAT_NOTICE_LOGGER") {
  require("./twitch-chat-logger/twitchChatNoticeLogger")
}

if (process.env.APP_NAME === "TWITCH_CHAT_QUEUE_FILLER") {
  require("./twitch-chat-logger/twitchChatQueueFiller")
}