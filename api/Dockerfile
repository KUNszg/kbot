FROM node:20.12.2-alpine

WORKDIR /usr/src/app

COPY ./connector ./connector
COPY ./lib/utils ./lib/utils
COPY ./data ./data/

COPY ./consts/serviceSettings.json ./consts/serviceSettings.json
COPY ./lib/credentials/config.js ./lib/credentials/config.js

RUN echo "{}" > ./data/aliases.json

WORKDIR /usr/src/app/kbot-api

COPY ./api .

EXPOSE 8080

CMD [ "node", "api.js" ]

# for local development manual mount of node_modules in config is required