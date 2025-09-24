import { Client, GatewayIntentBits, Collection, ChatInputCommandInteraction, Events, Partials, Embed } from "discord.js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getItemLevelForPlayer } from "./utils/blizzard.ts";
import { JsonConfigStore } from "./config/jsonStore.ts";
import { configManager } from "./config/manager.ts";



new JsonConfigStore("config.json"); // folder "config"

await configManager.init();

async function main() {

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));

for (const file of commandFiles) {
  const command = await import(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user?.tag}!`);
});

client.on(Events.MessageCreate, (message) => {
  // Ignore messages from *your own* bot
  if (message.author.id === client.user?.id) return;

  // Example: log ALL bot messages
  if (message.author.bot) {
    console.log(`[BOT] ${message.author.username}: ${message.content}`);
  }

  // Example: only listen to Raid-Helper (replace with actual bot ID)
  if (message.author.id === "RAID_HELPER_BOT_ID") {
    console.log("Raid Helper said:", message.content);

    // You could trigger a custom function here
    // like parseSignup(message.content)
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      console.log("Embed Title:", embed?.title);
      console.log("Embed Fields:", embed?.fields);
    }
  }
});


client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  console.log(oldMessage, newMessage)

  if (!newMessage.embeds.length) return;

  const embed = newMessage.embeds[0];

// Still figuring what I want here
  const title = embed?.data.title;
  const fields = embed?.data.fields;
  

  const parts = title?.split("-") || [];
  const raidName = parts[0]?.trim() || "Unknown Raid";
  const realm = (parts[1]?.trim().toLowerCase()) || "unknown";
  

  console.log(`Raid: ${raidName}, Realm: ${realm}`);

  if (!fields?.length) return;

  // Loop over signups in embed fields
  for (const field of fields) {
    if (field.name?.toLowerCase().includes("signups")) {
      const lines = field.value?.split("\n") || [];

      for (const line of lines) {
        const playerName = line.replace(/[*_]/g, "").trim(); // cleanup markdown if any
        if (!playerName) continue;

        // console.log(`Signup detected: ${playerName} on ${realm}`);

        const ilvl = await getItemLevelForPlayer(playerName, realm);

        if (ilvl === null) {
          await newMessage.reply(`⚠️ Could not fetch iLvl for ${playerName}-${realm}.`);
        } else {
          await newMessage.reply(
            `${playerName}-${realm} signed up with iLvl **${ilvl}**.`
          );
        }
      }
    }
  }
});







client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "There was an error executing that command!", ephemeral: true });
  }
});

  client.login(process.env.DISCORD_TOKEN);
}

main();
