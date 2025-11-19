FROM node:20.12.2-alpine

WORKDIR /usr/src/app

COPY ./commons ./commons
COPY ./consts ./consts

WORKDIR /usr/src/app/lib/mirrors

COPY ./lib/mirrors .

EXPOSE 8080

CMD [ "node", "mirrors.js" ]

# for local development manual mount of node_modules in config is required