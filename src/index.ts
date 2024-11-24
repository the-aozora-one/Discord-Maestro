import * as dotenv from 'dotenv'
import * as path from 'node:path'
import { Client, Events, GatewayIntentBits, REST, Routes, Snowflake } from 'discord.js'
import { COMMANDS } from './commands'
import { Player } from 'discord-player'
import { YoutubeiExtractor } from 'discord-player-youtubei'
import logger from './utils/logger'

dotenv.config({
    path: path.resolve('.env')
})
const token = process.env.DISCORD_TOKEN

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
})

// Run this code once when the bot is ready.
client.once(Events.ClientReady, async (client: Client<true>) => {
    const player = new Player(client, {
        skipFFmpeg: false,
    })
    await player.extractors.loadDefault((ext) => {
        return ![
            'YouTubeExtractor',
        ].includes(ext)
    })
    await player.extractors.register(YoutubeiExtractor, {})

    player.on('error', (error) => {
        logger.error(error)
    })
    player.events.on('playerError', (queue, error, track) => {
        logger.error({
            error: error,
            queue: queue,
            track: track,
        })
    }).on('error', (queue, error) => {
        logger.error({
            error: error,
            queue: queue,
        })
    })

    if ([
        'development',
        'dev',
    ].includes(process.env.ENVIRONMENT)) {
        await deployCommands(client)

        player.on('debug', (message) => {
            logger.debug(`[PLAYER]`, message)
        }).events.on('debug', (queue, message) => {
            logger.debug(`[PLAYER]`, {
                message: message,
            })
        })
    }

    logger.info(`Ready! Logged in as ${client.user.tag}`)
})

client.on(Events.GuildCreate, async (guild) => {
    await deployGuildCommands(guild.id)
})

client.on(Events.Error, (error) => {
    logger.error(error)
})

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) {
        return
    }

    const command = COMMANDS.find((command) => {
        return command.name === interaction.commandName
    })

    await interaction.deferReply({
        ephemeral: true,
    })

    command.execute(interaction)
})

// Login with the token
client.login(token)

async function deployCommands(client: Client<boolean>) {
    logger.debug(`Registering Slash Commands`)
    const rest = new REST({
        version: '10',
    }).setToken(process.env.DISCORD_TOKEN)

    logger.debug(`Collecting Slash Commands`)
    const commands = []
    for (const command of COMMANDS) {
        commands.push(command.data)
    }
    try {
        logger.info(`Started refreshing application (/) commands.`)

        logger.debug(`REST URI: ${Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)}`)
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            {
                body: commands,
            }
        )

        logger.info(`Successfully reloaded ${commands.length} application (/) commands.`)
    } catch (error) {
        logger.debug(`Something went wrong`)
        logger.error(error)
    }
}

async function deployGuildCommands(guildId: Snowflake) {
    logger.debug(`Registering Slash Commands for Guild`)
    const rest = new REST({
        version: '10',
    }).setToken(process.env.DISCORD_TOKEN)

    logger.debug(`Collecting Slash Commands`)
    const commands = []
    for (const command of COMMANDS) {
        commands.push(command.data)
    }
    try {
        logger.info(`Started refreshing guild (/) commands.`)

        logger.debug(`REST URI: ${Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)}`)
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            {
                body: commands,
            }
        )

        logger.info(`Successfully reloaded ${commands.length} guild (/) commands.`)
    } catch (error) {
        logger.debug(`Something went wrong`)
        logger.error(error)
    }
}