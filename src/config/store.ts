// Interface all config backends must follow
export interface ConfigStore {
    load(): Promise<void>;
    save(): Promise<void>;
    get<T>(guildId: string): T | undefined;
    set<T>(guildId: string, value: T): void;
    delete(guildId: string, key: string): void;
  }
  