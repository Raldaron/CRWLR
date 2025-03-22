// components/inventory/InventoryHelpers.tsx
import React from 'react';
import { Text, Badge } from '@chakra-ui/react';
import { InventoryItem } from '@/types/inventory';

// Helper function to safely convert any value to a React-friendly display format
const convertToReactNode = (value: any): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <Text color="gray.400">-</Text>;
  }
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Complex Object]';
    }
  }
  return String(value);
};

export const getColumnValue = (item: InventoryItem, column: string): React.ReactNode => {
  if (!item) return "-";
  let value: any;
  if (column in item && item[column as keyof InventoryItem] !== undefined) {
    value = item[column as keyof InventoryItem];
    return convertToReactNode(value);
  }
  const lowerCaseColumn = column.toLowerCase();
  for (const key in item) {
    if (key.toLowerCase() === lowerCaseColumn) {
      value = item[key as keyof InventoryItem];
      return convertToReactNode(value);
    }
  }
  switch (column) {
    case 'name':
      return convertToReactNode(item.name || '');
    case 'description':
      return convertToReactNode(item.description || '');
    case 'rarity':
      return convertToReactNode(item.rarity || '');
    case 'itemType':
      return convertToReactNode(item.itemType || '');
    case 'damage':
      return convertToReactNode(item.damage || item.damageAmount || '');
    case 'damageType':
      return convertToReactNode(item.damageType || '');
    case 'blastRadius':
      return convertToReactNode(item.blastRadius || item.radius || '');
    default:
      return "-";
  }
};

export const getColumnsForItemType = (itemType: string): string[] => {
  switch (itemType) {
    case 'Weapon':
      return ['name', 'weaponType', 'damageAmount', 'damageType', 'meleeRanged', 'rarity'];
    case 'Armor':
      return ['name', 'armorType', 'armorRating', 'tankModifier', 'rarity'];
    case 'Ammunition':
      return ['name', 'damageAmount', 'damageType', 'range', 'rarity'];
    case 'Potion':
      return ['name', 'effect', 'duration', 'rarity'];
    case 'Scroll':
      return ['name', 'effect', 'castingTime', 'cooldown', 'rarity'];
    case 'Crafting Component':
      return ['name', 'effect', 'rarity'];
    case 'Trap':
      return ['name', 'effect', 'duration', 'rarity'];
    case 'Explosive':
      return ['name', 'damage', 'damageType', 'blastRadius', 'rarity'];
    default:
      return ['name', 'itemType', 'rarity'];
  }
};

export const formatValue = (value: React.ReactNode): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return <Text color="gray.400">-</Text>;
  }
  if (React.isValidElement(value)) {
    return value;
  }
  return value;
};
