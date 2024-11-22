import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"
import { Command } from "../@types/command"

export const Ping: Command = {
    name: 'ping',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responds with Pong!'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.followUp('Pong!')
    }
}