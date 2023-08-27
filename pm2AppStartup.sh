cd ./api
pm2 start api.js
cd ../

cd ./lib/mirrors
pm2 start redditLiveThreadToDiscord.js
cd ../../

