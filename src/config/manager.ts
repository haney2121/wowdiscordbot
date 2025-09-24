import { ConfigStore } from "./store.ts";
import { JsonConfigStore } from "./jsonStore.ts";

class ConfigManager {
  private store: ConfigStore;

  constructor(store?: ConfigStore) {
    // Default to JSON backend, can swap later
    this.store = store ?? new JsonConfigStore();
  }

  async init() {
    await this.store.load();
  }

  get<T>(guildId: string): T | undefined {
    return this.store.get<T>(guildId);
  }

  set<T>(guildId: string, value: T) {
    return this.store.set<T>(guildId, value); // async, returns a promise
  }
  
}

export const configManager = new ConfigManager();


