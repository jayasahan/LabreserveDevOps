FROM node:24-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix ./server

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

WORKDIR /app/server
EXPOSE 5000

CMD ["node", "server.js"]
