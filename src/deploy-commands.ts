import { REST, Routes } from "discord.js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const commands: any[] = [];
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const command = await import(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands }
    );
    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
}

main();
