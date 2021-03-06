FROM node:lts-alpine

RUN mkdir -p /app/node_modules && chown -R node:node /app

WORKDIR /app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 4000

CMD [ "npm", "run", "dev" ]