const BASE_URL = "https://us.api.blizzard.com";
import "dotenv/config";
import { CharacterEquipment, EquippedItem } from '../types/blizzard.ts'
import { configManager } from "../config/manager.ts";

let token: string | null = null;
let expiresAt: number | null = null;

export async function getBlizzardToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if it exists and is not expired
  if (token !== null && expiresAt !== null && now < expiresAt) {
    return token;
  }

  // Fetch new token
  const resp = await fetch("https://us.battle.net/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(
        `${process.env.BLIZZARD_CLIENT_ID}:${process.env.BLIZZARD_CLIENT_SECRET}`
      ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!resp.ok) throw new Error("Failed to fetch Blizzard token");

  const data = await resp.json();

  if (!data.access_token || !data.expires_in) throw new Error("Invalid token response");

  token = data.access_token;
  expiresAt = now + (data.expires_in - 60) * 1000; // 1 min buffer
  return token as string;
}



// Generic fetch wrapper
async function blizzardFetch(url: string, token: string) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) return null; // fallback for 404/403
  return resp.json();
}

// Fetch main character profile
export async function getCharacterProfile(guildId: string, token: string, name: string) {
  // load config (realm + namespace) for this guild
  const apiConfig = configManager.get<{realm: string, namespace:string}>(guildId);

  const url = `${BASE_URL}/profile/wow/character/${apiConfig?.realm}/${name}?namespace=${apiConfig?.namespace}&locale=en_US`;
  return blizzardFetch(url, token);
}

// Fetch character media (portrait)
export async function getCharacterMedia(guildId: string, token: string, name: string) {
  const apiConfig = configManager.get<{realm: string, namespace:string}>(guildId);

  const url = `${BASE_URL}/profile/wow/character/${apiConfig?.realm}/${name}/character-media?namespace=${apiConfig?.namespace}&locale=en_US`;
  return blizzardFetch(url, token);
}

// Fetch equipment
export async function getCharacterEquipment(equipmentHref: string, token: string) {
  return blizzardFetch(equipmentHref, token);
}

// Fetch specializations
export async function getCharacterSpec(specializationsHref: string, token: string) {
  return blizzardFetch(specializationsHref, token);
}


export function formatEquipment(equipmentData: CharacterEquipment): EquippedItem[] {
  if (!equipmentData?.equipped_items) return [];
  return equipmentData.equipped_items;
}


// File: src/utils/blizzard.ts
export function getRarityEmoji(quality?: { type: string }): string {
    if (!quality) return "⬜"; // default white
    switch (quality.type) {
      case "COMMON": return "⬜";   // White
      case "UNCOMMON": return "🟢"; // Green
      case "RARE": return "🔵";     // Blue
      case "EPIC": return "🟣";     // Purple
      case "LEGENDARY": return "🟠"; // Orange/Gold
      default: return "⬜";
    }
  }
  
  export async function getItemLevelForPlayer(
    playerName: string,
    guildId: string
  ): Promise<number | null> {
    try {
      const token = await getBlizzardToken();
  
      // load config (realm + namespace) for this guild
  const apiConfig = configManager.get<{realm: string, namespace:string}>(guildId);
      
  
      if (!apiConfig) {
        console.warn(`No configuration set for server ${guildId}`);
        return null;
      }

      const {realm} = apiConfig
  
      // 1. Fetch character profile
      const profile = await getCharacterProfile(guildId, token, playerName.toLowerCase());
      if (!profile?.id) {
        console.warn(`Character not found: ${playerName}-${realm}`);
        return null;
      }
  
      // 2. Fetch equipment
      if (!profile.equipment) {
        console.warn(`No equipment link for: ${playerName}-${realm}`);
        return null;
      }
  
      const equipmentData: CharacterEquipment = await getCharacterEquipment(profile.equipment.href, token);
      if (!equipmentData) return null;
  
      // 3. Calculate average ilvl
      const items = equipmentData.equipped_items || [];
      const levels = items.map(item => item.level?.value ?? 0).filter(v => v > 0);
  
      if (levels.length === 0) return null;
  
      const avgIlvl = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
      return avgIlvl;
    } catch (err) {
      console.error("Error fetching iLvl:", err);
      return null;
    }
  }
  