import fs from "fs";
import path from "path";
import { ConfigStore } from "./store.ts";
import { fileURLToPath } from "url";

export class JsonConfigStore implements ConfigStore {
  private filePath: string;
  private data: Record<string, any> = {};
  private saving: Promise<void> | null = null;

  constructor(fileName = "config.json") {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Set path relative to src/config/data
    const dir = path.join(__dirname, "data");
    this.filePath = path.join(dir, fileName);
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = await fs.promises.readFile(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.data = {};
        await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
      }
    } catch (err) {
      console.error("Error loading config:", err);
      this.data = {};
    }
  }

  public async save(): Promise<void> {
    const tmpFile = this.filePath + ".tmp";
    const content = JSON.stringify(this.data, null, 2);

    const doSave = async () => {
      await fs.promises.writeFile(tmpFile, content);
      await fs.promises.rename(tmpFile, this.filePath);
    };

    if (this.saving) {
      this.saving = this.saving.then(doSave);
    } else {
      this.saving = doSave();
    }

    await this.saving;
    this.saving = null;
  }

  get<T>(guildId: string): T | undefined {
    console.log({data: this.data, guildId})
    return this.data[guildId];
  }

  async set<T>(guildId: string, value: T) {
    if (!this.data[guildId] || typeof this.data[guildId] !== "object") {
      this.data[guildId] = {};
    }
  
    Object.assign(this.data[guildId], value); // merge instead of key
    await this.save();
  }

  async delete(guildId: string, key?: string) {
    if (!this.data[guildId]) return;
    if (key) {
      delete this.data[guildId][key];
      if (Object.keys(this.data[guildId]).length === 0) delete this.data[guildId];
    } else {
      delete this.data[guildId];
    }
    await this.save();
  }
}
