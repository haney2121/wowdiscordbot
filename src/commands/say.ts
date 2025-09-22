import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("say")
  .setDescription("Bot repeats your message")
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription("Text to repeat")
      .setRequired(true)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const text = interaction.options.getString("text");
  await interaction.reply(text || "Nothing to say!");
};
