FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY scss ./scss
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY public ./public
COPY --from=build /app/public ./public
COPY server.mjs package.json ./
USER node
EXPOSE 8080
CMD ["npm", "run", "start"]
