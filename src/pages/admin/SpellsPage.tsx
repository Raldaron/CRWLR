// src/pages/admin/SpellsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  Center,
  useDisclosure,
} from '@chakra-ui/react';
import { Search, Plus } from 'lucide-react';
import { useSpells } from '@/hooks/useSpells';
import SpellCard from '@/components/actions/SpellCard';
import SpellDetailModal from '@/components/Modals/SpellDetailModal';
import { Spell } from '@/types/spell';

const SpellsPage: React.FC = () => {
  // Get spell data from our hook
  const { spells, loading, error, fetchSpells, fetchByArchetype } = useSpells();
  
  // State for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  
  // Modal control
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filter spells when search or filter changes
  useEffect(() => {
    let results = [...spells];
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      results = results.filter(spell => 
        spell.name.toLowerCase().includes(lowercaseSearch) ||
        (spell.spelldescription && spell.spelldescription.toLowerCase().includes(lowercaseSearch)) ||
        (spell.effectdescription && spell.effectdescription.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    // Apply archetype filter
    if (archetypeFilter) {
      results = results.filter(spell => 
        spell.archetype && spell.archetype.toLowerCase() === archetypeFilter.toLowerCase()
      );
    }
    
    setFilteredSpells(results);
  }, [searchTerm, archetypeFilter, spells]);

  // Get unique archetypes for filter dropdown
  const archetypes = Array.from(new Set(spells
    .filter(spell => spell.archetype)
    .map(spell => spell.archetype as string)
  )).sort();

  // Handle spell card click
  const handleSpellClick = (spell: Spell) => {
    setSelectedSpell(spell);
    onOpen();
  };

  return (
    <Box p={6}>
      <Heading size="xl" mb={6} color="blue.400">Spell Manager</Heading>
      
      {/* Search and Filters */}
      <HStack spacing={4} mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Search className="h-4 w-4 text-gray-400" />
          </InputLeftElement>
          <Input
            placeholder="Search spells..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select
          placeholder="Filter by archetype"
          value={archetypeFilter}
          onChange={e => setArchetypeFilter(e.target.value)}
          maxW="200px"
        >
          {archetypes.map(archetype => (
            <option key={archetype} value={archetype}>{archetype}</option>
          ))}
        </Select>
        
        <Button 
          variant="outline" 
          colorScheme="gray"
          onClick={() => {
            setSearchTerm('');
            setArchetypeFilter('');
          }}
        >
          Clear Filters
        </Button>
        
        <Button 
          colorScheme="blue" 
          leftIcon={<Plus size={16} />}
          ml="auto"
        >
          Create New Spell
        </Button>
      </HStack>
      
      {/* Loading state */}
      {loading && (
        <Center py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.400" />
            <Text color="gray.400">Loading spells...</Text>
          </VStack>
        </Center>
      )}
      
      {/* Error state */}
      {error && (
        <Center py={10}>
          <VStack spacing={4}>
            <Text color="red.400">Error loading spells</Text>
            <Button onClick={() => fetchSpells()}>Retry</Button>
          </VStack>
        </Center>
      )}
      
      {/* Spell grid */}
      {!loading && !error && (
        <>
          {filteredSpells.length === 0 ? (
            <Center py={10}>
              <Text color="gray.400">No spells match your search criteria</Text>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {filteredSpells.map(spell => (
                <SpellCard
                  key={spell.id || spell.name}
                  spell={spell}
                  onClick={() => handleSpellClick(spell)}
                  sourceItem="Spell Library"
                />
              ))}
            </SimpleGrid>
          )}
        </>
      )}
      
      {/* Spell Detail Modal */}
      <SpellDetailModal
        spell={selectedSpell}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Box>
  );
};

export default SpellsPage;