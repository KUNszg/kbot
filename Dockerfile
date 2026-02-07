FROM docker-registry.app.kunszg.com/kbot-base:latest

WORKDIR /usr/src/app

COPY ./commons ./commons
COPY ./consts ./consts
COPY ./data ./data/

COPY ./lib/credentials/config.js ./lib/credentials/config.js

WORKDIR /usr/src/app/kbot-backend

COPY ./lib .

EXPOSE 8080

CMD [ "node", "commandManager.js" ]