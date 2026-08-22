FROM node:20.12.2-alpine

WORKDIR /usr/src/app

COPY ./commons ./commons
COPY ./consts ./consts
COPY ./data ./data/

COPY ./lib/credentials/config.js ./lib/credentials/config.js

WORKDIR /usr/src/app/kbot-api

COPY ./api .

EXPOSE 8080

CMD [ "node", "api.js" ]

# for local development manual mount of node_modules in config is required