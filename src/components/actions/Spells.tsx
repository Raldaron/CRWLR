import React, { useState, useEffect } from 'react';
import { Scroll, Clock, Zap, Target } from 'lucide-react';
import {
  Box,
  SimpleGrid,
  VStack,
  Text,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/context/CharacterContext';
import type { Spell } from '@/types/spell';
import SpellDetailModal from '../Modals/SpellDetailModal';
import DarkThemedCard from '@/components/ui/DarkThemedCard';

interface SpellWithSource {
  spell: Spell;
  sourceItem: string;
}

const SpellCard = ({ 
  spell, 
  onClick, 
  sourceItem,
  spellLevel 
}: { 
  spell: Spell; 
  onClick: () => void;
  sourceItem: string;
  spellLevel: number;
}) => (
  <DarkThemedCard onClick={onClick} borderColor="blue.800">
    <VStack align="start" spacing={3}>
      <HStack>
        <Scroll className="text-blue-500" />
        <Text fontWeight="bold" fontSize="lg" color="blue.300">{spell.name}</Text>
      </HStack>
      
      <Text fontSize="sm" color="gray.400" noOfLines={2}>
        {spell.description}
      </Text>
      
      <Text fontSize="xs" color="gray.500">
        Source: {sourceItem}
      </Text>

      <HStack spacing={4}>
        <HStack spacing={1}>
          <Clock size={14} className="text-gray-500" />
          <Text fontSize="sm" color="gray.400">{spell.castingTime}</Text>
        </HStack>
        <Badge colorScheme="purple">
          {spell.archetype}
        </Badge>
        <Badge colorScheme="blue">
          Level {spellLevel}
        </Badge>
      </HStack>

      {spell.damage !== "N/A" && (
        <Text fontSize="sm" color="accent.400">
          Damage: {spell.damage} {spell.damageType}
        </Text>
      )}
    </VStack>
  </DarkThemedCard>
);

const Spells = () => {
  const { 
    equippedItems, 
    learnedSpells, 
    abilityLevels, 
    setAbilityLevel,
    saveCharacterManually 
  } = useCharacter();
  
  const [allSpells, setAllSpells] = useState<SpellWithSource[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<SpellWithSource | null>(null);
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get spell level from character state
  const getSpellLevel = (spellName: string) => {
    return abilityLevels[spellName] || 1;  // Default to level 1 if not set
  };

  useEffect(() => {
    const loadSpells = async () => {
      try {
        const response = await fetch('/data/spells.json');
        const data = await response.json();
        
        const allLoadedSpells: SpellWithSource[] = [];
        
        // Add spells from equipped items
        Object.entries(equippedItems).forEach(([slot, item]) => {
          if (item?.spellsGranted && Array.isArray(item.spellsGranted)) {
            item.spellsGranted.forEach((spellId: string) => {
              const spell = data.spells[spellId.toLowerCase()];
              if (spell) {
                allLoadedSpells.push({
                  spell,
                  sourceItem: `Granted by: ${item.name}`
                });
              }
            });
          }
        });

        // Add learned spells
        learnedSpells.forEach(spell => {
          allLoadedSpells.push({
            spell,
            sourceItem: 'Learned from Arcana'
          });
        });

        setAllSpells(allLoadedSpells);
      } catch (error) {
        console.error('Error loading spells:', error);
      }
    };

    loadSpells();
  }, [equippedItems, learnedSpells]);

  const handleSpellClick = (spellData: SpellWithSource) => {
    setSelectedSpell(spellData);
    setSelectedSpellLevel(getSpellLevel(spellData.spell.name));
    setIsModalOpen(true);
  };

  // Handle spell level change
  const handleSpellLevelChange = (spellName: string, level: number) => {
    setAbilityLevel(spellName, level);
    setSelectedSpellLevel(level);
    
    // Trigger a save to persist the changes
    if (saveCharacterManually) {
      setTimeout(() => {
        saveCharacterManually();
      }, 500);
    }
  };

  return (
    <Box p={4}>
      {allSpells.length === 0 ? (
        <VStack spacing={4} py={8}>
          <Text color="gray.400">No spells available</Text>
          <Text color="gray.500" fontSize="sm">
            Learn spells from the Arcana tab or equip items that grant spells
          </Text>
        </VStack>
      ) : (
        <ScrollArea className="h-[600px]">
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {allSpells.map(({ spell, sourceItem }) => (
              <SpellCard
                key={`${spell.name}-${sourceItem}`}
                spell={spell}
                sourceItem={sourceItem}
                onClick={() => handleSpellClick({ spell, sourceItem })}
                spellLevel={getSpellLevel(spell.name)}
              />
            ))}
          </SimpleGrid>
        </ScrollArea>
      )}

      <SpellDetailModal
        spell={selectedSpell?.spell || null}
        sourceItem={selectedSpell?.sourceItem}
        spellLevel={selectedSpellLevel}
        onLevelChange={handleSpellLevelChange}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedSpell(null);
          setIsModalOpen(false);
        }}
      />
    </Box>
  );
};

export default Spells;