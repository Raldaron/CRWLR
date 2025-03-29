// equipmentAbilitiesManager.ts

// This class keeps track of abilities and traits from equipment
export class EquipmentAbilitiesManager {
    private abilities: Set<string> = new Set();
    private traits: Set<string> = new Set();
    
    // Add abilities and traits from an item
    addFeatures(item: any) {
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
    
    // Remove abilities and traits from an item
    removeFeatures(item: any) {
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
    
    // Get all current abilities
    getAbilities(): string[] {
      return Array.from(this.abilities);
    }
    
    // Get all current traits
    getTraits(): string[] {
      return Array.from(this.traits);
    }
    
    // Check if a specific ability is active
    hasAbility(ability: string): boolean {
      return this.abilities.has(ability);
    }
    
    // Check if a specific trait is active
    hasTrait(trait: string): boolean {
      return this.traits.has(trait);
    }
    
    // Reset everything
    reset() {
      this.abilities.clear();
      this.traits.clear();
    }
  }