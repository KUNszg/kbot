FROM docker-registry.app.kunszg.com/kbot-base:latest

WORKDIR /usr/src/app

COPY ./commons ./commons
COPY ./consts ./consts

COPY ./lib/credentials/config.js ./lib/credentials/config.js

WORKDIR /usr/src/app/lib/mirrors

COPY ./lib/mirrors .

EXPOSE 8080

CMD [ "node", "mirrors.js" ]
