cd ./api
pm2 start api.js
cd ../

cd ./lib/mirrors

cd ./reddit-live-thread-to-discord
pm2 start redditLiveThreadToDiscord.js
cd ../

cd ./twitch-chat-logger
pm2 start twitchChatMessageLogger.js
pm2 start twitchChatQueueFiller.js
pm2 start twitchChatBanphrasedMessageLogger.js
cd ../

cd ../../

cd ./lib/misc/task-manager
pm2 start taskManager.js
cd ../../../