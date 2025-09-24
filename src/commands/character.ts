import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { formatEquipment, getBlizzardToken, getRarityEmoji } from "../utils/blizzard.ts"; // <-- make sure .ts extension for ts-node
import { getCharacterEquipment, getCharacterMedia, getCharacterSpec } from "../utils/blizzard.ts";
import { getCharacterProfile } from "../utils/blizzard.ts";
import { configManager } from "../config/manager.ts";

export const data = new SlashCommandBuilder()
  .setName("character")
  .setDescription("Look up a Classic WoW character")
  .addStringOption(option =>
    option.setName("name")
      .setDescription("Character name")
      .setRequired(true))

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const guildId = interaction.guildId!;
  const apiConfig = configManager.get<{realm: string, namespace:string}>(guildId);

  if (!apiConfig?.realm && !apiConfig?.namespace) {
    await interaction.reply({
      content: "⚠️ Missing realm and edition, configured for this server. Run `/config realm <realm>` first.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  
  const name = interaction.options.getString("name", true).toLowerCase();

  await interaction.deferReply();

  try {
    const token = await getBlizzardToken();

    const profile = await getCharacterProfile(guildId, token, name);
    const media = await getCharacterMedia(guildId, token, name);
    const equipment = profile.equipment ? await getCharacterEquipment(profile.equipment.href, token) : null;
    const specData = profile.specializations ? await getCharacterSpec(profile.specializations.href, token) : null;
    
    const activeSpec = specData?.specializations?.find((s: any) => s.active)?.spec.name || "Not available";
    const portraitUrl = media?.assets?.find((a: any) => a.key === "avatar")?.value || undefined;
    const formattedItems = formatEquipment(equipment);
    
    // Build embed
    const embed = new EmbedBuilder()
    .setTitle(`${profile.name} - Level ${profile.level} ${profile.character_class.name}`)
    .setDescription(`${profile.race.name} | ${profile.faction.name} | Realm: ${profile.realm.name}`)
    .setColor(profile.faction.type === "ALLIANCE" ? 0x3498db : 0xe74c3c)
    .setThumbnail(portraitUrl as string)
    .addFields(
      { name: "Guild", value: profile.guild?.name || "None", inline: true },
      { name: "Average iLvl", value: profile.average_item_level.toString(), inline: true },
      { name: "Equipped iLvl", value: profile.equipped_item_level.toString(), inline: true },
      { name: "Specialization", value: activeSpec || "Not available", inline: true },
      { name: "PvP Title", value: "Not available", inline: true }
    )
    .setFooter({ text: `Last login: ${new Date(profile.last_login_timestamp).toLocaleString()}` });
  
    formattedItems.forEach(item => {
        embed.addFields({
          name: `${getRarityEmoji(item.quality)} ${item.slot.name.en_US}`,
          value: `${item.name.en_US}${item.level ? ` (iLvl ${item.level.value})` : ""}`,
          inline: true
        });
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await interaction.editReply("Could not fetch character data. Make sure the name and realm are correct.");
  }
};
