import { WeaponItem } from "@/types/weapon";
import { ArmorItem } from "@/types/armor";

class FeatureManager {
    private abilities: Set<string> = new Set();
    private traits: Set<string> = new Set();
    private equippedItems: { [slot: string]: WeaponItem | ArmorItem | null } = {};
  
    equipItem(slot: string, item: WeaponItem | ArmorItem | null) {
      // If we have an existing item in this slot, remove its features
      if (this.equippedItems[slot]) {
        this.removeFeatures(this.equippedItems[slot]);
      }
  
      // Store the new item
      this.equippedItems[slot] = item;
  
      // If we have a new item, add its features
      if (item) {
        this.addFeatures(item);
      }
    }
  
    addFeatures(item: WeaponItem | ArmorItem) { // Make public if needed by equipMultipleItems logic
      // Add abilities if the item has them
      if (item.abilities && Array.isArray(item.abilities)) {
        item.abilities.forEach((ability: string) => {
          this.abilities.add(ability);
        });
      }
  
      // Add traits if the item has them
      if (item.traits && Array.isArray(item.traits)) {
        item.traits.forEach((trait: string) => {
          this.traits.add(trait);
        });
      }
    }
  
    removeFeatures(item: WeaponItem | ArmorItem | null) { // Make public if needed by equipMultipleItems logic
      if (!item) return;
  
      // Remove abilities if the item has them
      if (item.abilities && Array.isArray(item.abilities)) {
        item.abilities.forEach((ability: string) => {
          this.abilities.delete(ability);
        });
      }
  
      // Remove traits if the item has them
      if (item.traits && Array.isArray(item.traits)) {
        item.traits.forEach((trait: string) => {
          this.traits.delete(trait);
        });
      }
    }
  
    getAbilities(): string[] {
      return Array.from(this.abilities);
    }
  
    getTraits(): string[] {
      return Array.from(this.traits);
    }
  
    hasAbility(ability: string): boolean {
      return this.abilities.has(ability);
    }
  
    hasTrait(trait: string): boolean {
      return this.traits.has(trait);
    }
  
    reset() {
      this.abilities.clear();
      this.traits.clear();
      this.equippedItems = {};
    }
  }