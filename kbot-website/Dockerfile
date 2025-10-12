FROM node:20.12.2-alpine AS builder

WORKDIR /build

COPY commons ./commons
COPY lib ./lib
COPY kbot-website ./kbot-website

WORKDIR /build/kbot-website

RUN npm install

RUN npm run build

FROM node:20.12.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /build/kbot-website/package.json ./
COPY --from=builder /build/kbot-website/.next ./.next
COPY --from=builder /build/kbot-website/node_modules ./node_modules
COPY --from=builder /build/kbot-website/public ./public

COPY --from=builder /build/commons ../commons
COPY --from=builder /build/lib ../lib

EXPOSE 3000

CMD ["npm", "run", "start"]