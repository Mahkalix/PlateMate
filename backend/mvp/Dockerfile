FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY sql ./sql
USER node
EXPOSE 3001
CMD ["sh", "-ec", "node --import tsx src/db.ts migrate && exec node --import tsx src/server.ts"]
