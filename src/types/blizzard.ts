export interface LocalizedString {
    en_US: string;
    [locale: string]: string;
  }
  
  export interface EquipmentSlot {
    type: string;
    name: LocalizedString;
  }
  
  export interface ItemLevel {
    value: number;
  }
  
  export interface Media {
    key: string;
    id: number;
    assets?: { key: string; value: string }[];
  }
  
  export interface EquippedItem {
    id: number;
    name: LocalizedString;
    slot: EquipmentSlot;
    level?: ItemLevel; // optional because some items like tabards may not have level
    media?: Media;
    quantity?: number;
    quality?: { type: string; name: LocalizedString };
    inventory_type?: { type: string; name: LocalizedString };
    item_class?: { key: { href: string }; name: LocalizedString; id: number };
    item_subclass?: { key: { href: string }; name: LocalizedString; id: number };
    sell_price?: { value: number; display_strings: string[] };
  }
  
  export interface CharacterEquipment {
    equipped_items: EquippedItem[];
    equipped_item_sets?: any[];
    character: {
      id: number;
      name: string;
      realm: { id: number; name: string; slug?: string };
    };
    _links: { self: { href: string } };
  }
  