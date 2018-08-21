FROM node:6 as nodedev

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN chown -R node:node /usr/src/app

USER node

RUN npm install
