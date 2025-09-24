import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { configManager } from "../config/manager.ts";
import { EmbedBuilder } from "discord.js";
import { titleCase } from "../utils/formatters.ts";

const namespaceMap: Record<string, string> = {
  "profile-us": "Retail",
  "profile-classic-us": "Mists of Pandaria",
  "profile-classic1x-us": "Classic Era/Anniversary",
  "profile-tbc-us": "The Burning Crusade",
  "profile-wotlk-us": "Wrath of the Lich King"
};


export const data = new SlashCommandBuilder()
.setName("config")
.setDescription("Set server config")
.addStringOption(opt =>
    opt.setName("realm").setDescription("Default WoW realm").setRequired(true)
).addStringOption(option =>
    option.setName("namespace")
      .setDescription("Game version/namespace")
      .setRequired(false)
      .addChoices(
       Object.entries(namespaceMap).map(([key, value]) => ({name: value, value: key}))
      ));


export  const execute = async (interaction: ChatInputCommandInteraction) => {
    const realm = interaction.options.getString("realm", true);
    const namespaceRaw = interaction.options.getString("namespace", true);
    const guildId = interaction.guildId!;

    configManager.set(guildId, { realm, namespace: namespaceRaw });

    const namespaceDisplay = namespaceMap[namespaceRaw] || namespaceRaw;

    const embed = new EmbedBuilder()
      .setTitle("Configuration Updated")
      .setColor("Green")
      .setDescription(`✅ Realm: **${titleCase(realm)}**\n✅ Game Edition: **${namespaceDisplay}**`);

    await interaction.reply({ embeds: [embed] });
  }