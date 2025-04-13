// --- START OF FILE components/ItemCards/SpellCard.tsx ---
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon, // Import Icon
  Tooltip, // Import Tooltip
} from '@chakra-ui/react';
import { Zap, Clock, Crosshair, ScrollText } from 'lucide-react'; // Import ScrollText
import DarkThemedCard from '@/components/ui/DarkThemedCard';
// Import ActionSpell type from CharacterContext
import type { ActionSpell } from '@/context/CharacterContext';

interface SpellCardProps {
  spell: ActionSpell; // Use ActionSpell type
  onClick: () => void;
  isSelected?: boolean;
}

const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  onClick,
  isSelected = false,
}) => {
  // Helper to format N/A or empty values
  const formatValue = (value: string | number | undefined | null) =>
    value === undefined || value === null || value === '' || String(value).toUpperCase() === 'N/A' ? '-' : String(value);

  return (
    <DarkThemedCard
      onClick={onClick}
      isSelected={isSelected}
      borderColor={isSelected ? "brand.400" : "purple.800"} // Use purple theme for spells
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        borderColor: "purple.600"
      }}
      height="160px" // Consistent height
    >
      <VStack spacing={2} align="start" justify="space-between" h="full">
        <HStack width="full" justify="space-between">
          <HStack spacing={2}>
            <Icon as={Zap} color="purple.400" boxSize={4} />
            <Text fontWeight="bold" color="gray.200" noOfLines={1}>
              {spell.name}
            </Text>
          </HStack>
          {/* NEW: Display Scroll Icon if source is scroll */}
          {spell.source === 'scroll' && (
             <Tooltip label="From Scroll" placement="top" bg="gray.700" color="white">
                 <Badge colorScheme="orange" variant="solid" borderRadius="full" px={1}><Icon as={ScrollText} boxSize={3} /></Badge>
             </Tooltip>
          )}
        </HStack>

        <Text fontSize="xs" color="gray.400" noOfLines={2}>
          {spell.spelldescription || spell.effectdescription || 'No description.'}
        </Text>

        <HStack spacing={4} fontSize="xs" color="gray.300" width="full" wrap="wrap">
          <HStack spacing={1}>
            <Icon as={Clock} boxSize={3} color="cyan.400" />
            <Text>{formatValue(spell.castingTime)}</Text>
          </HStack>
          <HStack spacing={1}>
            <Icon as={Crosshair} boxSize={3} color="green.400" />
            <Text>{formatValue(spell.range)}</Text>
          </HStack>
          <HStack spacing={1}>
            <Icon as={Zap} boxSize={3} color="blue.400" />
            <Text>{formatValue(spell.manaPointCost)} MP</Text>
          </HStack>
           {/* Optionally show damage if relevant */}
           {spell.damage && formatValue(spell.damage) !== '-' && (
                <HStack spacing={1}>
                     {/* Replace Zap with a damage icon if you have one */}
                    <Icon as={Zap} boxSize={3} color="red.400" />
                    <Text>{formatValue(spell.damage)} {formatValue(spell.damageType)}</Text>
                </HStack>
            )}
        </HStack>

        <HStack spacing={1} wrap="wrap">
           {spell.school && <Badge colorScheme="purple" variant="subtle">{spell.school}</Badge>}
           {spell.archetype && <Badge colorScheme="teal" variant="outline">{spell.archetype}</Badge>}
        </HStack>

      </VStack>
    </DarkThemedCard>
  );
};

export default SpellCard;
// --- END OF FILE components/ItemCards/SpellCard.tsx ---