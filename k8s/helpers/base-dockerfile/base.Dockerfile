FROM node:20.12.2-alpine AS base

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci && npm cache clean --force [cite: 1]