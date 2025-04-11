export interface Attack { // Rename this to Action eventually
    id: string;
    name: string;
    weaponId?: string; // Make optional for non-weapon actions
    slot?: 'primaryWeapon' | 'secondaryWeapon'; // Make optional
    damageAmount?: string; // Optional
    damageType?: string; // Optional
    description: string;
    weaponType?: string; // Optional
    meleeRanged?: 'Melee' | 'Ranged'; // Optional
    handsRequired?: string; // Optional
    range?: string; // Optional
    sourceItem?: string; // Keep this for context
    abilities?: string[]; // Optional
    traits?: string[]; // Optional
    magicNonMagical?: 'Magical' | 'Non-Magical'; // Optional
    statBonus?: Record<string, number>; // Optional
    skillBonus?: Record<string, number>; // Optional
    isCustom?: boolean; // Optional

    // --- NEW/MODIFIED FIELDS ---
    sourceType: 'Attack' | 'Spell' | 'Ability' | 'Utility'; // Added 'Utility'
    sourceId: string; // ID of the source (weapon ID, spell ID, ability ID, or *utility slot ID*)
    itemId?: string;   // ID of the item in the utility slot
    itemType?: string; // Type of the item in the utility slot
    icon?: React.ElementType; // Icon for display
    onExecute?: () => void; // Function to call when executed
}