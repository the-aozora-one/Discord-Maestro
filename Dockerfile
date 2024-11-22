FROM node:20

RUN apt-get -y update \
    && apt-get -y upgrade \
    && apt-get install -y ffmpeg \
    && apt-get clean
    # && mkdir -p /home/node/discord-maestro/node_modules && chown -R node:node /home/node/discord-maestro

WORKDIR /home/node/discord-maestro

COPY package*.json ./
COPY .env.example ./.env
COPY . .
# COPY --chown=node:node . .
# RUN npm run build
RUN npm i
# Raspberry PI requirements
RUN npm i mediaplex-linux-arm64-gnu @discordjs/opus
RUN npm run build

CMD [ "node" , "dist/index.js" ]