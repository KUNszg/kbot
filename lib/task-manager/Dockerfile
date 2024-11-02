FROM node:20.12.2-alpine

WORKDIR /usr/src/app

COPY ./commons ./commons
COPY ./consts ./consts

COPY ./consts/serviceSettings.json ./consts/serviceSettings.json
COPY ./lib/credentials/config.js ./lib/credentials/config.js

WORKDIR /usr/src/app/kbot-task-manager

COPY ./lib/task-manager ./lib

WORKDIR /usr/src/app/kbot-task-manager/lib

EXPOSE 8080

CMD [ "node", "taskManager.js" ]

# for local development manual mount of node_modules in config is required