# Discord Maestro

[Add Maestro to your Discord Server](https://discord.com/oauth2/authorize?client_id=1308534503417053266&permissions=3164160&integration_type=0&scope=applications.commands+bot)

Maestro is a bot for Discord that allows users to play music in voice channels. \
The bot utilizes multiple libraries, but I would like to thank the fine folks that made [discord.js]() and [discord-player]() for the great work they have done.

## Install

### Manual

1. Clone this repo.
1. Copy `.env.example` to `.env`.
1. Add your credentials to `.env`.
1. Install FFMPEG locally. If you do not use the default path, add the path to the `FFMPEG_PATH` variable in `.env`.
1. Run these commands:
    ```bash
    # Install all node dependencies
    npm i
    # Compile the TypeScript files
    npm run build
    # Start the application
    npm run start
    ```
1. Add your version of Maestro to your Discord server.

### Docker

#### Build Image

```bash
docker compose build
docker push username/discord-maestro
```

#### Build Container

Create the docker container for Maestro
```bash
docker pull username/discord-maestro
docker container create --name discord-maestro username/discord-maestro
```
Copy `.env.example` and modify with your credentials before copying it over again.
```bash
docker cp containerid:/home/node/discord-maestro/.env.example /host/path/to/file/discord-maestro.env

docker cp /host/path/to/file/discord-maestro.env containerid:/home/node/discord-maestro/.env
```

Start up your container
```bash
docker start discord-maestro
```

If you later want to add auto restart to your container
```bash
docker update --restart=always discord-maestro
```
