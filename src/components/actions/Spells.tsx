import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/context/CharacterContext';
import type { Spell } from '@/types/spell';
import SpellDetailModal from '../Modals/SpellDetailModal';
import SpellCard from './SpellCard';

// Import Firebase utilities if you're using them
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface SpellWithSource {
  spell: Spell;
  sourceItem: string;
}

const Spells: React.FC = () => {
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
  const [isLoading, setIsLoading] = useState(true);

  // Get spell level from character state
  const getSpellLevel = (spellName: string) => {
    return abilityLevels[spellName] || 1;  // Default to level 1 if not set
  };

  useEffect(() => {
    const loadSpells = async () => {
      setIsLoading(true);
      try {
        const allLoadedSpells: SpellWithSource[] = [];
        
        // Get all spells from the spells collection
        const spellsRef = collection(db, 'spells');
        const spellsSnapshot = await getDocs(spellsRef);
        
        // Create a map of spell IDs to spell objects for quick lookup
        const spellsMap = new Map();
        spellsSnapshot.forEach((doc) => {
          const spell = {
            id: doc.id,
            ...doc.data() as Spell
          };
          spellsMap.set(doc.id.toLowerCase(), spell);
        });
        
        // Add spells from equipped items
        Object.entries(equippedItems).forEach(([slot, item]) => {
          if (item?.spellsGranted && Array.isArray(item.spellsGranted)) {
            item.spellsGranted.forEach(async (spellId: string) => {
              // Try to find the spell in our map
              const normalizedSpellId = spellId.toLowerCase();
              
              if (spellsMap.has(normalizedSpellId)) {
                const spell = spellsMap.get(normalizedSpellId);
                allLoadedSpells.push({
                  spell,
                  sourceItem: `Granted by: ${item.name}`
                });
              } else {
                // If not found in the map, try to fetch it directly
                try {
                  const spellDoc = await getDoc(doc(db, 'spells', normalizedSpellId));
                  if (spellDoc.exists()) {
                    const spell = {
                      id: spellDoc.id,
                      ...spellDoc.data() as Spell
                    };
                    allLoadedSpells.push({
                      spell,
                      sourceItem: `Granted by: ${item.name}`
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to load spell ${spellId} from item ${item.name}:`, error);
                }
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
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.300">Loading spells...</Text>
        </VStack>
      </Center>
    );
  }

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