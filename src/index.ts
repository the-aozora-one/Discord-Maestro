import * as dotenv from 'dotenv'
import * as path from 'node:path'
import { Client, Events, GatewayIntentBits, REST, Routes, Snowflake } from 'discord.js'
import { COMMANDS } from './commands'
import { Player } from 'discord-player'
import { YoutubeiExtractor } from 'discord-player-youtubei'

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
        console.error(`[ERROR]`, error)
    })
    player.events.on('playerError', (queue, error, track) => {
        console.error(`[ERROR]`, {
            error: error,
            queue: queue,
            track: track,
        })
    }).on('error', (queue, error) => {
        console.error(`[ERROR]`, {
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
            console.debug(`[PLAYER]`, message)
        })
        .events.on('debug', (queue, message) => {
            console.debug(`[PLAYER]`, {
                message: message,
            })
        })
    }

    console.log(`Ready! Logged in as ${client.user.tag}`)
})

client.on(Events.GuildCreate, async (guild) => {
    await deployGuildCommands(guild.id)
})

client.on(Events.Error, (error) => {
    console.error(error)
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
    console.debug(`Registering Slash Commands`)
    const rest = new REST({
        version: '10',
    }).setToken(process.env.DISCORD_TOKEN)

    console.debug(`Collecting Slash Commands`)
    const commands = []
    for (const command of COMMANDS) {
        commands.push(command.data)
    }
    try {
        console.log(`Started refreshing application (/) commands.`)

        console.debug(`REST URI: ${Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)}`)
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            {
                body: commands,
            }
        )

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`)
    } catch (error) {
        console.debug(`Something went wrong`)
        console.error(error)
    }
}

async function deployGuildCommands(guildId: Snowflake) {
    console.debug(`Registering Slash Commands for Guild`)
    const rest = new REST({
        version: '10',
    }).setToken(process.env.DISCORD_TOKEN)

    console.debug(`Collecting Slash Commands`)
    const commands = []
    for (const command of COMMANDS) {
        commands.push(command.data)
    }
    try {
        console.log(`Started refreshing guild (/) commands.`)

        console.debug(`REST URI: ${Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)}`)
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            {
                body: commands,
            }
        )

        console.log(`Successfully reloaded ${commands.length} guild (/) commands.`)
    } catch (error) {
        console.debug(`Something went wrong`)
        console.error(error)
    }
}