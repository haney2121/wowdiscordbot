import { Client, GatewayIntentBits, Collection, ChatInputCommandInteraction } from "discord.js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function main() {

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));

for (const file of commandFiles) {
  const command = await import(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user?.tag}!`);
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
