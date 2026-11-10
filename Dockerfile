FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix ./server
COPY server/ ./server/

WORKDIR /app/server
EXPOSE 5000

CMD ["node", "server.js"]
