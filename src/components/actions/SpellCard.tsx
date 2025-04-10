import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { Scroll, Clock, Zap } from 'lucide-react';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { Spell } from '@/types/spell';

interface SpellCardProps {
  spell: Spell;
  onClick?: () => void;
  sourceItem?: string;
  spellLevel?: number;
}

const SpellCard: React.FC<SpellCardProps> = ({ 
  spell, 
  onClick, 
  sourceItem = "Unknown Source",
  spellLevel = 1
}) => {
  // Helper function to get mana cost color
  const getManaCostColor = (cost: string) => {
    const manaValue = parseInt(cost);
    if (isNaN(manaValue) || manaValue === 0) return 'gray';
    if (manaValue <= 2) return 'blue';
    if (manaValue <= 5) return 'purple';
    return 'red';
  };

  // Process description text to extract a clean preview
  const getDescriptionPreview = (description: string) => {
    if (!description) return "No description available";
    
    // Replace literal "\n" with actual newlines
    const processed = description.replace(/\\n/g, '\n');
    
    // Split into lines
    const lines = processed.split('\n');
    
    // Try to find the effect description first
    let effectLine = lines.find(line => line.toLowerCase().includes('effect:'));
    
    if (!effectLine) {
      // If no effect line, find a line that's not a label and has reasonable length
      effectLine = lines.find(line => {
        const isLabel = /^(Type|Cost|Duration|Cooldown|Target|Warning)/.test(line);
        return !isLabel && line.trim().length > 10;
      });
    }
    
    // If we found an effect line, extract just the content
    if (effectLine) {
      // Remove the "Effect:" label if present
      effectLine = effectLine.replace(/^Effect:\s*/i, '');
      
      // Fix any text issues
      effectLine = effectLine
        .replace(/\be(f?)ect/g, "effect")
        .replace(/\be(f?)ects/g, "effects")
        .replace(/\bsu(f?)er/g, "suffer")
        .replace(/\bbu(f?)s/g, "buffs");
      
      return effectLine;
    }
    
    // Fallback to the first non-empty line
    return lines.find(line => line.trim().length > 0) || "No description available";
  };

  // Get a preview of the description
  const descriptionText = spell.effectdescription || spell.spelldescription || "";
  const previewText = getDescriptionPreview(descriptionText);

  return (
    <DarkThemedCard onClick={onClick} borderColor="blue.800">
      <VStack align="start" spacing={3}>
        <HStack>
          <Scroll className="text-blue-500" />
          <Text fontWeight="bold" fontSize="lg" color="blue.300">{spell.name}</Text>
        </HStack>
        
        {/* Show a preview of the spell description */}
        <Text fontSize="sm" color="gray.400" noOfLines={2}>
          {previewText}
        </Text>
        
        <Text fontSize="xs" color="gray.500">
          Source: {sourceItem}
        </Text>

        <HStack spacing={4}>
          <HStack spacing={1}>
            <Clock size={14} className="text-gray-500" />
            <Text fontSize="sm" color="gray.400">{spell.castingTime}</Text>
          </HStack>
          {spell.archetype && (
            <Badge colorScheme="purple">
              {spell.archetype}
            </Badge>
          )}
          {spellLevel && (
            <Badge colorScheme="blue">
              Level {spellLevel}
            </Badge>
          )}
        </HStack>

        {/* Mana Cost */}
        {spell.manaPointCost && (
          <Badge colorScheme={getManaCostColor(spell.manaPointCost.toString())}>
            <HStack spacing={1}>
              <Zap size={12} />
              <Text>{spell.manaPointCost}</Text>
            </HStack>
          </Badge>
        )}

        {/* Damage info (if applicable) */}
        {spell.damage && spell.damage !== "N/A" && (
          <Text fontSize="sm" color="accent.400">
            Damage: {spell.damage} {spell.damageType}
          </Text>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default SpellCard;