FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY sql ./sql
RUN groupadd --system platemate && useradd --system --gid platemate platemate && mkdir /data && chown platemate:platemate /data
USER platemate
ENV MEDIA_DIR=/data/media
EXPOSE 3000
CMD ["node","src/server.js"]
