// File: src/commands/clear.ts
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Bulk delete messages in the channel")
  .addIntegerOption(option =>
    option.setName("amount")
      .setDescription("Number of messages to delete (1-100)")
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const amount = interaction.options.getInteger("amount", true);

  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: "This command can only be used in text channels.", ephemeral: true });
    return;
  }

  const deleteAmount = Math.min(amount, 100);

  try {
    const deleted = await interaction.channel.bulkDelete(deleteAmount, true);
    await interaction.reply({ content: `Deleted ${deleted.size} messages.`, ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: "Failed to delete messages. Check my permissions.", ephemeral: true });
  }
};
