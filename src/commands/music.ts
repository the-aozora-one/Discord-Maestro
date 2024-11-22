import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, time, VoiceBasedChannel } from 'discord.js'
import { Command } from '../@types/command'
import { QueueRepeatMode, useHistory, useMainPlayer, useQueue, useTimeline } from 'discord-player'

export const Music: Command = {
    name: 'music',
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Play music in the user\'s voice channel.')
        .addSubcommand((subcommand) => {
            return subcommand.setName('jump')
                .setDescription('Skip to a specific song in the queue.')
                .addIntegerOption((option) => {
                    return option.setName('position')
                        .setDescription('The position of the song in the queue.')
                        .setMinValue(1)
                        .setRequired(true)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('leave')
                .setDescription('Force the bot to leave the voice channel.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('move')
                .setDescription('Organize the songs in the queue.')
                .addIntegerOption((option) => {
                    return option.setName('current')
                        .setDescription('The current position of the song.')
                        .setRequired(true)
                        .setMinValue(1)
                }).addIntegerOption((option) => {
                    return option.setName('target')
                        .setDescription('The desired position of the song.')
                        .setRequired(true)
                        .setMinValue(1)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('pause')
                .setDescription('Pause playback.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('play')
                .setDescription('Add a song to the queue.')
                .addStringOption((option) => {
                    return option.setName('song')
                        .setDescription('The search terms or link for a song.')
                        .setRequired(true)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('previous')
                .setDescription('Play the previous song again.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('queue')
                .setDescription('Show the queue.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('repeat')
                .setDescription('Toggle song and queue repeat.')
                .addIntegerOption((option) => {
                    return option.setName('mode')
                        .setDescription(`Get or set song repeat.`)
                        .addChoices({
                            name: 'Repeat Current Song',
                            value: QueueRepeatMode.TRACK,
                        }, {
                            name: 'Repeat Queue',
                            value: QueueRepeatMode.QUEUE,
                        }, {
                            name: 'Autoplay Next Song',
                            value: QueueRepeatMode.AUTOPLAY,
                        }, {
                            name: 'Repeat Off',
                            value: QueueRepeatMode.OFF,
                        })
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('resume')
                .setDescription('Resume playback.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('seek')
                .setDescription('Set playback to the specified time stamp.')
                .addNumberOption((option) => {
                    return option.setName('seconds')
                        .setDescription('The timestamp to start playback in seconds.')
                        .setRequired(true)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('shuffle')
                .setDescription('Get or set the queue shuffling.')
                .addBooleanOption((option) => {
                    return option.setName('enable')
                        .setDescription("Enable shuffling.")
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('skip')
                .setDescription('Skip the current song.')
                .addIntegerOption((option) => {
                    return option.setName('position')
                        .setDescription('The position of the song to skip to.')
                        .setMinValue(1)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('stop')
                .setDescription('Stop all playback.')
        }).addSubcommand((subcommand) => {
            return subcommand.setName('volume')
                .setDescription('Get or set the music volume.')
                .addNumberOption((option) => {
                    return option.setName('volume')
                        .setDescription('The volume to use.')
                        .setMinValue(0)
                        .setMaxValue(100)
                })
        })
    ,
    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand()

        const member: GuildMember = interaction.member as GuildMember
        const targetVoiceChannel: VoiceBasedChannel = member.voice.channel
        if (!targetVoiceChannel) {
            await interaction.followUp({
                ephemeral: true,
                content: `You must be in a voice channel to use this command.`
            })
            return
        }

        console.debug(`Running /music ${subcommand}`)
        switch (subcommand) {
            case 'autoplay':
                // autoplay(interaction, targetVoiceChannel)
                break
            case 'jump':
                await jump(interaction)
                break
            case 'leave':
                await leave(interaction)
                break
            case 'move':
                await move(interaction)
                break
            case 'pause':
                await pause(interaction)
                break
            case 'play':
                await play(interaction, targetVoiceChannel)
                break
            case 'previous':
                await previous(interaction)
                break
            case 'queue':
                await queue(interaction)
                break
            case 'repeat':
                await repeat(interaction, targetVoiceChannel)
                break
            case 'resume':
                await resume(interaction)
                break
            case 'seek':
                await seek(interaction)
                break
            case 'shuffle':
                await shuffle(interaction)
                break
            case 'skip':
                await skip(interaction)
                break
            case 'stop':
                await stop(interaction)
                break
            case 'volume':
                await volume(interaction)
                break
            default:
                await interaction.followUp({
                    ephemeral: true,
                    content: `There is no "${subcommand}" command.`
                })
                break
        }
    }
}

async function jump(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (queue.isEmpty()) {
        await interaction.followUp({
            ephemeral: true,
            content: `There is nothing in the queue right now.`,
        })
        return
    }

    const position = interaction.options.getInteger('position')
    if (position > queue.size) {
        await interaction.followUp({
            ephemeral: true,
            content: `There is no song at position ${position}.`,
        })
        return
    }

    queue.node.jump(queue.tracks.at(position - 1))
    await interaction.followUp({
        ephemeral: true,
        content: `I have jumped to song ${position}`,
    })
}

async function leave(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (!queue) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`
        })
    }

    queue.delete()

    await interaction.followUp({
        ephemeral: true,
        content: `I'm leaving now.`,
    })
}

async function move(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (queue.isEmpty()) {
        await interaction.followUp({
            ephemeral: true,
            content: `There are no songs in the queue.`,
        })
        return
    }

    const currentPosition = interaction.options.getInteger('current')
    const targetPosition = interaction.options.getInteger('target')

    if (currentPosition === targetPosition) {
        await interaction.followUp({
            ephemeral: true,
            content: `No songs needed to be moved.`,
        })
        return
    }

    if (currentPosition >= queue.size || targetPosition > queue.size) {
        await interaction.followUp({
            ephemeral: true,
            content: `The positions must be within the range of the queue.`,
        })
        return
    }

    queue.node.move(queue.tracks.at(currentPosition - 1), targetPosition - 1)
    await interaction.followUp({
        ephemeral: true,
        content: `I have moved the song from position ${currentPosition} to ${targetPosition}.`,
    })
}

async function pause(interaction: ChatInputCommandInteraction): Promise<void> {
    const timeline = useTimeline(interaction.guildId)

    if (!timeline?.track) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`
        })
        return
    }

    if (timeline.paused) {
        await interaction.followUp({
            ephemeral: true,
            content: `The song is already paused.`,
        })
        return
    }

    timeline.pause()

    await interaction.followUp({
        ephemeral: true,
        content: `I have paused playback.`,
    })
}

async function play(interaction: ChatInputCommandInteraction, targetVoiceChannel: VoiceBasedChannel): Promise<void> {
    const player = useMainPlayer()
    const query = interaction.options.getString('song')

    const result = await player.search(query, {
        requestedBy: interaction.user,
    })

    if (!result.hasTracks()) {
        interaction.followUp({
            ephemeral: true,
            content: `No results were found for "${query}"`,
        })
        return
    }

    console.debug(result.tracks.map((track) => {
        return `${track.raw.title} ${track.raw.author} [${track.raw.source}](${track.raw.url})`
    }))

    try {
        const { track, searchResult } = await player.play(targetVoiceChannel, result, {
            nodeOptions: {
                metadata: {
                    interaction: interaction,
                },
                noEmitInsert: true,
                leaveOnStop: false,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 60000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 60000,
                pauseOnEmpty: true,
                preferBridgedMetadata: false,
                disableBiquad: true,
                selfDeaf: true,
            },
            requestedBy: interaction.user,
            connectionOptions: {
                deaf: true,
            },
        })

        const playlistTrackTitle = searchResult.hasPlaylist()
            ? `Playlist Queued [${searchResult.playlist.title}]`
            : `Track Queued [${track.title}]`
        const embed = new EmbedBuilder()
            .setTitle(playlistTrackTitle)
            .setThumbnail(track.thumbnail)
            .setDescription(`[${track.title} - ${track.author}](${track.url})`)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
        if (searchResult.playlist) {
            embed.addFields([
                {
                    name: 'Playlist',
                    value: searchResult.playlist.title,
                }
            ])
        }

        interaction.followUp({
            ephemeral: true,
            embeds: [embed],
        })
    } catch (error) {
        console.error(`[ERROR]`, error)
        interaction.followUp({
            ephemeral: true,
            content: `Something went wrong. Try again.`
        })
    }
}

async function previous(interaction: ChatInputCommandInteraction): Promise<void> {
    const history = useHistory(interaction.guildId)

    if (!history) {
        await interaction.followUp({
            ephemeral: true,
            content: `I'm not playing anything right now.`,
        })
        return
    }

    if (history.isEmpty()) {
        await interaction.followUp({
            ephemeral: true,
            content: `There is no previous song to play.`,
        })
        return
    }

    await history.back()
    await interaction.followUp({
        ephemeral: true,
        content: `I am now playing the previous song.`,
    })
}

async function queue(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (queue === null) {
        await interaction.followUp({
            ephemeral: true,
            content: `There are no songs in the queue right now.`
        })
        return
    }

    const rawContent = queue?.tracks?.map((track, index) => {
        return `**${index + 1}** [${track.cleanTitle} - ${track.author}](${track.url}) - (${track.duration})`
    }).join('\n')
    const content = rawContent.length > 4096
        ? `${rawContent.substring(0, 4090)}...`
        : rawContent
    const embed = new EmbedBuilder()
        .setTitle(`Current Playing: ${queue.currentTrack.cleanTitle} - ${queue.currentTrack.author}`)
        .setThumbnail(queue.currentTrack.thumbnail)
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
        })
    if (content.length > 0) {
        embed.setDescription(content)
    }
    await interaction.followUp({
        ephemeral: true,
        embeds: [embed],
    })
}

async function repeat(interaction: ChatInputCommandInteraction, targetVoiceChannel: VoiceBasedChannel): Promise<void> {
    const queue = useQueue(interaction.guildId)
    
    if (!queue?.isPlaying()) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`,
        })
        return
    }

    const mode = interaction.options.getInteger('mode', false)
    if (mode === null) {
        await interaction.followUp({
            ephemeral: true,
            content: `The current repeat mode is ${QueueRepeatMode[queue.repeatMode]}.`,
        })
        return
    }

    queue.setRepeatMode(mode)

    await interaction.followUp({
        ephemeral: true,
        content: `I have changed the repeat mode to ${QueueRepeatMode[mode]}.`,
    })
}

async function resume(interaction: ChatInputCommandInteraction): Promise<void> {
    const timeline = useTimeline(interaction.guildId)

    if (!timeline?.track) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`
        })
        return
    }

    if (!timeline.paused) {
        await interaction.followUp({
            ephemeral: true,
            content: `Playback is not paused.`,
        })
        return
    }

    timeline.resume()

    await interaction.followUp({
        ephemeral: true,
        content: `I have resumed playback.`,
    })
}

async function seek(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (!queue.isPlaying() && queue.isEmpty()) {
        await interaction.followUp({
            ephemeral: true,
            content: `There are no songs in the queue right now.`,
        })
        return
    }

    const seconds = interaction.options.getNumber('seconds')
    if (seconds * 1000 >= queue.currentTrack.durationMS) {
        await interaction.followUp({
            ephemeral: true,
            content: `The given timestamp is outside the length of the current song.`,
        })
        return
    }

    await queue.node.seek(seconds * 1000)
    await interaction.followUp({
        ephemeral: true,
        content: `I have changed the playback to ${seconds} for this song.`,
    })
}

async function shuffle(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (queue.isEmpty()) {
        await interaction.followUp({
            ephemeral: true,
            content: `There are no songs in the queue right now.`,
        })
        return
    }

    const enable = interaction.options.getBoolean('enable', false)
    if (enable === null) {
        await interaction.followUp({
            ephemeral: true,
            content: `The shuffling mode is currently set to ${queue.isShuffling ? '**On**' : '**Off**'}`,
        })
        return
    }

    if (enable && queue.isShuffling) {
        await interaction.followUp({
            ephemeral: true,
            content: `The queue is already shuffling.`,
        })
        return
    }

    if (!enable && !queue.isShuffling) {
        await interaction.followUp({
            ephemeral: true,
            content: `The queue shuffling is already off.`,
        })
        return
    }

    if (enable) {
        queue.enableShuffle()
        await interaction.followUp({
            ephemeral: true,
            content: `I will shuffle the queue automatically.`
        })
    } else {
        queue.disableShuffle()
        await interaction.followUp({
            ephemeral: true,
            content: `I will no longer shuffle the queue.`,
        })
    }
}

async function skip(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (!queue?.isPlaying()) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`,
        })
        return
    }

    const position = interaction.options.getInteger('position', false)

    if (position === null) {
        queue.node.skip()

        await interaction.followUp({
            ephemeral: true,
            content: `I've skipped to the next song.`,
        })
    }

    if (position - 1 < queue.size) {
        queue.node.skipTo(queue.tracks.at(position - 1))

        await interaction.followUp({
            ephemeral: true,
            content: `I've skipped the next ${position} songs.`,
        })
        return
    }

    await interaction.followUp({
        ephemeral: true,
        content: `There are fewer than ${position} songs in the queue.`,
    })
}

async function stop(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = useQueue(interaction.guildId)

    if (!queue.isPlaying()) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`,
        })
        return
    }

    queue.node.stop()

    await interaction.followUp({
        ephemeral: true,
        content: `I have stopped the track.`,
    })
}

async function volume(interaction: ChatInputCommandInteraction): Promise<void> {
    const timeline = useTimeline(interaction.guildId)

    if (!timeline?.track) {
        await interaction.followUp({
            ephemeral: true,
            content: `I am not playing anything right now.`,
        })
        return
    }

    const volume = interaction.options.getNumber('volume', false)
    if (volume === null) {
        await interaction.followUp({
            ephemeral: true,
            content: `The current volume is ${timeline.volume}%,`
        })
        return
    }

    timeline.setVolume(volume)

    await interaction.followUp({
        ephemeral: true,
        content: `I have changed the volume to ${volume}%.`
    })
}