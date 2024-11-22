import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { Command } from '../@types/command'
import { RecommendationsResponse, SpotifyApi } from '@spotify/web-api-ts-sdk'

type RecommendationOptions = {
    limit: number,
    seed_tracks?: any,
    seed_artists?: any,
}

export const Recommend: Command = {
    name: 'recommend',
    data: new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Get music recommendations.')
        .addSubcommand((subcommand) => {
            return subcommand.setName('artist')
                .setDescription('Get music recommendations based on a list of artists.')
                .addStringOption((option) => {
                    return option.setName('artist-1')
                        .setDescription('An artist from which to base the recommendations.')
                        .setRequired(true)
                }).addStringOption((option) => {
                    return option.setName('artist-2')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('artist-3')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('artist-4')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('artist-5')
                        .setDescription('An artist from which to base the recommendations.')
                }).addIntegerOption((option) => {
                    return option.setName('count')
                        .setDescription('The maximum number of recommendations to show.')
                        .setMinValue(1)
                        .setMaxValue(5)
                        .setRequired(false)
                })
        }).addSubcommand((subcommand) => {
            return subcommand.setName('song')
                .setDescription('Get music recommendations based on a list of songs.')
                .addStringOption((option) => {
                    return option.setName('song-1')
                        .setDescription('An artist from which to base the recommendations.')
                        .setRequired(true)
                }).addStringOption((option) => {
                    return option.setName('song-2')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('song-3')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('song-4')
                        .setDescription('An artist from which to base the recommendations.')
                }).addStringOption((option) => {
                    return option.setName('song-5')
                        .setDescription('An artist from which to base the recommendations.')
                }).addIntegerOption((option) => {
                    return option.setName('count')
                        .setDescription('The maximum number of recommendations to show.')
                        .setMinValue(1)
                        .setMaxValue(5)
                        .setRequired(false)
                })
        })
    ,
    execute: async (interaction: ChatInputCommandInteraction) => {
        // Connect to the Spotify API with our credentials
        const api = SpotifyApi.withClientCredentials(
            process.env.SPOTIFY_TOKEN,
            process.env.SPOTIFY_SECRET,
        )

        const subcommand = interaction.options.getSubcommand()

        if (subcommand === 'artist') {
            await recommendationsFromArtist(api, interaction)
        } else if (subcommand === 'song') {
            await recommendationsFromSong(api, interaction)
        } else {
            console.warn(`${subcommand} was received as a subcommand for ${Recommend.name}.`)
            interaction.followUp(`${subcommand} is not a valid option. Please choose one of the following instead: artist, song`)
        }
    }
}

async function recommendationsFromArtist(api: SpotifyApi, interaction: ChatInputCommandInteraction) {
    const recommendationLimit: number = interaction.options.getInteger('count') ?? 3

    const queries: string[] = []
    for (let i = 1; i <= 5; i++) {
        const query = interaction.options.getString(`artist-${i}`)
        if (query) {
            queries.push(query)
        }
    }

    const artistIds: string[] = []
    for (const artist of queries) {
        const results = await api.search(artist, ['artist'])
        artistIds.push(results.artists.items[0].id)
    }

    const recommendations = await api.recommendations.get({
        limit: recommendationLimit,
        seed_artists: artistIds,
    })

    sendRecommendations(recommendations, interaction, recommendationLimit)
}

async function recommendationsFromSong(api: SpotifyApi, interaction: ChatInputCommandInteraction) {
    const recommendationLimit: number = interaction.options.getInteger('count') ?? 3

    const queries: string[] = []
    for (let i = 1; i <= 5; i++) {
        const query = interaction.options.getString(`song-${i}`)
        if (query) {
            queries.push(query)
        }
    }

    const songIds: string[] = []
    for (const song of queries) {
        const results = await api.search(song, ['track'])
        songIds.push(results.tracks.items[0].id)
    }

    const recommendations = await api.recommendations.get({
        limit: recommendationLimit,
        seed_tracks: songIds,
    })

    sendRecommendations(recommendations, interaction, recommendationLimit)
}


function sendRecommendations(response: RecommendationsResponse, interaction: ChatInputCommandInteraction, recommendationLimit: number) {
    let baseText = generateBaseText(interaction)

    const tracks = response.tracks
    const totalFoundRecommendations = response.tracks.length

    // Create the embeds
    const embeds = createEmbeds(tracks)

    if (totalFoundRecommendations === 0) {
        return interaction.editReply(`I couldn't find any recommendations for this ${interaction.options.getSubcommand()}.`)
    }

    if (totalFoundRecommendations === recommendationLimit) {
        if (totalFoundRecommendations === 1) {
            return interaction.followUp({
                content: `${baseText}, here is a song you might enjoy.`,
                embeds: embeds,
            })
        }
        
        return interaction.followUp({
            content: `${baseText}, here are ${totalFoundRecommendations} songs for you to try.`,
            embeds: embeds,
        })
    }

    if (totalFoundRecommendations === 1) {
        return interaction.followUp({
            content: `${baseText}, I only found one song to recommend.`,
            embeds: embeds,
        })
    }

    return interaction.followUp({
        content: `${baseText}, I found ${totalFoundRecommendations} songs that are similar`,
        embeds: embeds,
    })
}

/**
 * Generates informative text that is included in the reply.
 * @param {ChatInputCommandInteraction} interaction the interaction that triggered this command
 * @returns String
 */
function generateBaseText(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    let baseText = ''
    if (subcommand === 'artist' || subcommand === 'song') {
        baseText = `Based on the following ${subcommand}s: `
        let optionName = `${subcommand}`
        const options = []
        for (let i = 1; i <= 5; i++) {
            const option = interaction.options.getString(`${optionName}-${i}`)
            if (option) {
                options.push(option)
            }
        }
        if (options.length === 1) {
            baseText += `${options[0]}`
        } else {
            options.forEach((option, index, options) => {
                if (index === options.length - 1 ) {
                    baseText += `and ${option}`
                } else {
                    baseText += `${option}, `
                }
            })
        }
    } else {
        baseText = `Based on the options you gave`
    }

    return baseText
}

/**
 * Creates the embeds that are sent with the reply.
 * @param {Array} tracks a list a tracks
 * @returns Array - a list of embeds
 */
function createEmbeds(tracks: any[]) {
    const embeds: EmbedBuilder[] = [];
    for (const track of tracks) {
        // Get the track duration for the embed
        const durationMinutes = Math.floor(track.duration_ms / (60 * 1000))
        const durationSeconds = Math.floor(track.duration_ms / 1000 % 60)

        // Get the smallest image for the embed image
        let smallestImage: any
        for (const image of track.album.images) {
            if (
                smallestImage === undefined ||
                smallestImage['height'] * smallestImage['width'] > image['height'] * image['width']
            ) {
                smallestImage = image;
            }
        }

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(track.name)
            .setURL(track.external_urls.spotify)
            .setImage(track.album.images[0].url)
            .setAuthor({
                name: track.artists[0].name,
            }).setDescription(`Listen to ${track.name} on Spotify.`)
            .addFields({
                name: 'Artist',
                value: track.artists[0].name,
            }, {
                name: 'Album',
                value: track.album.name,
            }, {
                name: 'Length',
                value: `${durationMinutes}:${durationSeconds}`,
            }).setTimestamp()
        embeds.push(embed)
    }

    return embeds
}