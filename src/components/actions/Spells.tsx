// --- START OF FILE components/actions/Spells.tsx ---
'use client'; // Add if not present

import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Spinner,
  Center,
  VStack,
  Alert,
  AlertIcon,
  HStack, // Added HStack
  Icon, // Added Icon
} from '@chakra-ui/react';
import { Search, ScrollText } from 'lucide-react'; // Added ScrollText icon
import { ScrollArea } from '@/components/ui/scroll-area';
import SpellCard from '@/components/ItemCards/SpellCard'
import SpellDetailModal from '@/components/Modals/SpellDetailModal';
import { useCharacter } from '@/context/CharacterContext';
import type { ActionSpell } from '@/context/CharacterContext'; // Import ActionSpell type

const Spells: React.FC = () => {
  // Use the NEW combined spell list from context
  const { allCharacterSpells } = useCharacter();
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<ActionSpell | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract unique schools (handle nulls/undefined)
  const uniqueSchools = Array.from(
    new Set(allCharacterSpells.map(spell => spell.school).filter(Boolean)) // Filter out null/undefined
  ).sort();

  // Filter spells based on search and school
  const filteredSpells = allCharacterSpells.filter(spell => {
    const matchesSearch = searchTerm === '' ||
      spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spell.spelldescription && spell.spelldescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (spell.effectdescription && spell.effectdescription.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSchool = schoolFilter === '' || spell.school === schoolFilter;

    return matchesSearch && matchesSchool;
  });

  const handleSpellClick = (spell: ActionSpell) => {
    setSelectedSpell(spell);
    setIsModalOpen(true);
  };

  // --- Loading state check (optional, context might handle it) ---
  // const { isLoading } = useCharacter(); // Assuming context provides loading state
  // if (isLoading) { return <Center h="400px"><Spinner size="xl" /></Center>; }

  return (
    <Box p={4}>
      <VStack spacing={4} mb={4} align="stretch">
        <HStack spacing={4} direction={{ base: 'column', md: 'row' }}>
          <InputGroup size="sm" flex={1}>
            <InputLeftElement pointerEvents="none">
              <Search className="h-4 w-4 text-gray-400" />
            </InputLeftElement>
            <Input
              placeholder="Search spells by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.800"
              borderColor="gray.700"
              _hover={{ borderColor: 'gray.600' }}
              pl={8}
            />
          </InputGroup>
          <Select
            placeholder="Filter by school"
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ borderColor: 'gray.600' }}
            size="sm"
            maxW={{ base: 'full', md: '200px' }}
            iconColor="gray.400"
          >
            {uniqueSchools.map(school => (
              <option key={school} value={school} style={{ backgroundColor: "#2D3748" }}>
                {school}
              </option>
            ))}
          </Select>
        </HStack>
      </VStack>

      {filteredSpells.length === 0 ? (
        <Center h="200px" bg="gray.800" borderRadius="md">
          <Text color="gray.400">
            {allCharacterSpells.length === 0 ? 'No spells learned or scrolls equipped.' : 'No spells match your current filter.'}
          </Text>
        </Center>
      ) : (
        <ScrollArea className="h-[600px]">
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {filteredSpells.map((spell) => (
              <Box key={spell.id} position="relative"> {/* Ensure unique key */}
                {/* Conditionally render scroll icon badge */}
                {spell.source === 'scroll' && (
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    zIndex={1}
                    colorScheme="orange"
                    variant="solid"
                    borderRadius="full"
                    px={0}
                    py={0}
                    minW="20px"
                    h="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    title="From Scroll"
                  >
                    <Icon as={ScrollText} boxSize={3} />
                  </Badge>
                )}
                <SpellCard
                  spell={spell} // Pass the ActionSpell object
                  onClick={() => handleSpellClick(spell)}
                />
              </Box>
            ))}
          </SimpleGrid>
        </ScrollArea>
      )}

      {/* The SpellDetailModal should ideally accept ActionSpell now */}
      {/* If it strictly requires Spell, you might need casting or adjustment */}
      <SpellDetailModal
        spell={selectedSpell} // Pass ActionSpell, Modal might need adjustment
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  );
};

export default Spells;
// --- END OF FILE components/actions/Spells.tsx ---