// src/utils/spellConverter.ts
import { Spell } from '@/types/spell';

/**
 * Converts data from a raw source (like a CSV) to a Spell object
 */
export const convertToSpell = (rawData: any): Spell => {
  return {
    id: rawData.id,
    name: rawData.name || '',
    spelldescription: rawData.spelldescription || rawData.description || '',
    effectdescription: rawData.effectdescription || rawData.effect || '',
    range: rawData.range || 'N/A',
    damage: rawData.damage || 'N/A',
    damageType: rawData.damageType || rawData.damage_type || 'N/A',
    castingTime: rawData.castingTime || rawData.casting_time || 'N/A',
    manaPointCost: rawData.manaPointCost || rawData.mana_cost || '0',
    cooldown: rawData.cooldown || 'N/A',
    duration: rawData.duration || 'N/A', // Added missing duration field
    archetype: rawData.archetype || '',
    keywords: rawData.keywords || '',
    scaling: rawData.scaling || {},
    spellCastingModifier: rawData.spellCastingModifier || rawData.spell_casting_modifier || '',
    savingThrow: rawData.savingThrow || rawData.saving_throw || '',
  };
};

/**
 * Converts a spell object to a format suitable for Firebase storage
 */
export const convertSpellForStorage = (spell: Spell): Record<string, any> => {
  // Remove any undefined or null values
  const sanitizedSpell: Record<string, any> = {};
  
  Object.entries(spell).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      sanitizedSpell[key] = value;
    }
  });
  
  return sanitizedSpell;
};

/**
 * Formats spell data for display
 */
export const formatSpellForDisplay = (spell: Spell): Spell => {
  const formattedSpell = { ...spell };
  
  // Replace escaped newlines with actual newlines
  if (formattedSpell.spelldescription) {
    formattedSpell.spelldescription = formattedSpell.spelldescription.replace(/\\n/g, '\n');
  }
  
  if (formattedSpell.effectdescription) {
    formattedSpell.effectdescription = formattedSpell.effectdescription.replace(/\\n/g, '\n');
  }
  
  return formattedSpell;
};