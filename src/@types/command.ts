import { CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export type Command = {
    name: string,
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder,
    execute: (interaction: CommandInteraction) => Promise<void>
}