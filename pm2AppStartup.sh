cd ./api
pm2 start api.js
cd ../

cd ./lib/mirrors
pm2 start redditLiveThreadToDiscord.js
cd ../../

cd ./lib/misc/task-manager
pm2 start taskGenerator.js
pm2 start taskManager.js
cd ../../../