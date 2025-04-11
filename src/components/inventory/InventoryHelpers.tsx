// components/inventory/InventoryHelpers.tsx
import React from 'react';
import { Text, Badge } from '@chakra-ui/react';
import { InventoryItem } from '@/types/inventory';

// Re-import or redefine DEFAULT_COLUMNS and ITEM_TYPE_COLUMNS if needed from inventory.ts
export const DEFAULT_COLUMNS = ['name', 'itemType', 'rarity'];

export const ITEM_TYPE_COLUMNS: Record<string, string[]> = {
  'Weapon': ['name', 'weaponType', 'damageAmount', 'damageType', 'meleeRanged', 'rarity'],
  'Armor': ['name', 'armorType', 'armorRating', 'tankModifier', 'rarity'],
  'Ammunition': ['name', 'damageAmount', 'damageType', 'range', 'rarity'], // Removed radius if not used
  'Potion': ['name', 'effect', 'duration', 'rarity'], // Simplified Potion view
  'Pharmaceutical': ['name', 'effect', 'duration', 'rarity'], // Simplified view
  'Scroll': ['name', 'effect', 'castingTime', 'rarity'], // Simplified Scroll view
  'Crafting Component': ['name', 'rarity'], // Basic view for components
  'Trap': ['name', 'damage', 'triggerMechanism', 'rarity'], // Simplified Trap view
  'Explosive': ['name', 'damage', 'blastradius', 'rarity'], // Simplified Explosive view
  'Throwable': ['name', 'damage', 'blastradius', 'rarity'], // Simplified Throwable view
  'Recipe': ['name', 'rarity', 'description'], // Define columns for Recipe items
  'Miscellaneous': ['name', 'description', 'rarity'],
};


// Convert various data types to a displayable React node
const convertToReactNode = (value: any): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <Text color="gray.400" as="span">-</Text>; // Use span for inline context
  }
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return String(value); // Return as string
  }
  if (Array.isArray(value)) {
    // Handle empty arrays specifically
    if (value.length === 0 || (value.length === 1 && value[0] === '')) {
        return <Text color="gray.400" as="span">-</Text>;
    }
    // Display first few elements for brevity in tables
    const preview = value.slice(0, 3).join(', ');
    return value.length > 3 ? `${preview}...` : preview;
  }
   // Handle simple objects (like statBonus) - display keys with values
   if (typeof value === 'object' && !React.isValidElement(value)) {
       const entries = Object.entries(value).filter(([_, val]) => val !== 0 && val !== null && val !== undefined); // Filter out zero/null/undefined
       if (entries.length === 0) return <Text color="gray.400" as="span">-</Text>;
       return entries.map(([k, v]) => `${k}: ${v}`).slice(0, 2).join(', ') + (entries.length > 2 ? '...' : '');
   }
  // Fallback for other types or complex objects
  return typeof value === 'object' ? '[Object]' : String(value);
};

// Get the display value for a specific column in an item
export const getColumnValue = (item: InventoryItem | null, column: string): React.ReactNode => {
  if (!item) return "-";

  // Direct property access (case-sensitive)
  if (column in item && item[column as keyof InventoryItem] !== undefined) {
    return convertToReactNode(item[column as keyof InventoryItem]);
  }

  // Case-insensitive property access
  const lowerCaseColumn = column.toLowerCase();
  for (const key in item) {
    if (key.toLowerCase() === lowerCaseColumn && item[key as keyof InventoryItem] !== undefined) {
      return convertToReactNode(item[key as keyof InventoryItem]);
    }
  }

  // Specific known column mappings and fallbacks
  switch (lowerCaseColumn) {
    case 'damage': // Handle potential damage vs damageAmount difference
      return convertToReactNode(item.damage || item.damageAmount || '');
    case 'trigger':
       return convertToReactNode(item.triggerMechanism || '');
     case 'blast radius':
        return convertToReactNode(item.blastradius || '');
    // Add more specific mappings if needed
    default:
      return "-"; // Not found
  }
};

// Get columns based on item type (remains the same logic)
export const getColumnsForItemType = (itemType: string): string[] => {
    const normalizedItemType = itemType ? itemType.trim() : '';
    const lowerCaseType = normalizedItemType.toLowerCase();

    // Handle combined types explicitly if needed for column display
    if (lowerCaseType === 'pharmaceutical') return ITEM_TYPE_COLUMNS['Potion'] || DEFAULT_COLUMNS;
    if (lowerCaseType === 'throwable') return ITEM_TYPE_COLUMNS['Explosive'] || DEFAULT_COLUMNS;

    // Use direct lookup first
    let columns = ITEM_TYPE_COLUMNS[normalizedItemType];
    if (columns) return columns;

    // Fallback to lowercase lookup
    columns = ITEM_TYPE_COLUMNS[Object.keys(ITEM_TYPE_COLUMNS).find(key => key.toLowerCase() === lowerCaseType) || ''];
    return columns || DEFAULT_COLUMNS;
};


// Format value for display (remains the same logic)
export const formatValue = (value: React.ReactNode): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <Text color="gray.400" as="span">-</Text>; // Use span
  }
  if (React.isValidElement(value)) {
    return value;
  }
  return String(value); // Ensure it's a string for rendering
};