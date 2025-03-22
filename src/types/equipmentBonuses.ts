// types/equipmentBonuses.ts

// Define interfaces that allow dynamic string indexing
interface StatBonuses {
  [key: string]: number;  // Allows any string key for stat bonuses
}

interface SkillBonuses {
  [key: string]: number;  // Allows any string key for skill bonuses
}

// Class to manage equipment bonuses
export class EquipmentBonusManager {
  private statBonuses: StatBonuses = {};  // This stores stat bonuses
  private skillBonuses: SkillBonuses = {};  // This stores skill bonuses
  private equippedItems: { [slot: string]: any } = {};  // Track what's equipped in each slot

  // Add a new item and its bonuses
  equipItem(slot: string, item: any) {
    // First remove any existing item in that slot
    if (this.equippedItems[slot]) {
      this.removeItemBonuses(this.equippedItems[slot]);
    }

    // Save the new item
    this.equippedItems[slot] = item;

    // Add the new item's bonuses if an item was provided
    if (item) {
      this.addItemBonuses(item);
    }
  }

  // Remove an item and its bonuses
  unequipItem(slot: string) {
    const item = this.equippedItems[slot];
    if (item) {
      this.removeItemBonuses(item);
      delete this.equippedItems[slot];
    }
  }

  // Add bonuses from an item (private method)
  private addItemBonuses(item: any) {
    // Handle stat bonuses
    if (item.vitalBonus || item.statBonus) {
      const bonuses = item.vitalBonus || item.statBonus;
      Object.entries(bonuses).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) + Number(bonus);
      });
    }

    // Handle skill bonuses
    if (item.skillBonus) {
      Object.entries(item.skillBonus).forEach(([skill, bonus]) => {
        this.skillBonuses[skill] = (this.skillBonuses[skill] || 0) + Number(bonus);
      });
    }
  }

  // Remove bonuses from an item (private method)
  private removeItemBonuses(item: any) {
    // Remove stat bonuses
    if (item.vitalBonus || item.statBonus) {
      const bonuses = item.vitalBonus || item.statBonus;
      Object.entries(bonuses).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) - Number(bonus);
        if (this.statBonuses[stat] === 0) {
          delete this.statBonuses[stat];
        }
      });
    }

    // Remove skill bonuses
    if (item.skillBonus) {
      Object.entries(item.skillBonus).forEach(([skill, bonus]) => {
        this.skillBonuses[skill] = (this.skillBonuses[skill] || 0) - Number(bonus);
        if (this.skillBonuses[skill] === 0) {
          delete this.skillBonuses[skill];
        }
      });
    }
  }

  // Get all stat bonuses as a new object
  getStatBonuses(): StatBonuses {
    return { ...this.statBonuses };
  }

  // Get all skill bonuses as a new object
  getSkillBonuses(): SkillBonuses {
    return { ...this.skillBonuses };
  }

  // Get a specific stat bonus
  getStatBonus(stat: string): number {
    return this.statBonuses[stat] || 0;  // Return 0 if the stat has no bonus
  }

  // Get a specific skill bonus
  getSkillBonus(skill: string): number {
    return this.skillBonuses[skill] || 0;  // Return 0 if the skill has no bonus
  }

  // Reset all bonuses and equipped items to 0
  reset() {
    this.statBonuses = {};  // Clear stat bonuses
    this.skillBonuses = {};  // Clear skill bonuses
    this.equippedItems = {};  // Clear equipped items
  }
}