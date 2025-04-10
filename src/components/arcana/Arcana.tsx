import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  Text,
  VStack,
  Badge,
  useDisclosure,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Search, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SpellDetailModal from '@/components//Modals/SpellDetailModal'; // Check if double slash is intended or typo
import { useCharacter } from '@/context/CharacterContext';
import { Spell } from '@/types/spell';

// Import Firebase utilities
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const ITEMS_PER_PAGE = 10;

const Arcana: React.FC = () => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [page, setPage] = useState(0);
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [damageTypeFilter, setDamageTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { addToLearnedSpells, learnedSpells } = useCharacter();

  // Format display value - replace "N/A" with "-"
  const formatValue = (value: string | number | undefined | null) => {
     // Modified formatValue to handle undefined/null/empty/"N/A" more robustly
    if (value === undefined || value === null || String(value).trim() === '' || String(value).toUpperCase() === 'N/A') {
        return "-";
    }
    return String(value);
  };

  // Check if a spell is already learned
  const isSpellLearned = (spell: Spell) => {
    return learnedSpells.some(s => s.name === spell.name);
  };

  // Load spells data from Firebase
  useEffect(() => {
    const loadSpells = async () => {
      setIsLoading(true);
      try {
        // Get reference to the spells collection
        const spellsCollectionRef = collection(db, 'spells');

        // Get all documents from the collection
        const spellsSnapshot = await getDocs(spellsCollectionRef);

        // Convert the snapshot to an array of spell objects
        const spellsArray: Spell[] = [];

        spellsSnapshot.forEach((doc) => {
          const spellData = doc.data() as Spell; // Get the data
          const spellId = doc.id; // Get the ID

          // --- ADDED DEBUG LOG HERE ---
          // Log the descriptions right after fetching, before adding to state
          console.log(`DEBUG Firestore Fetch (Arcana.tsx - ID: ${spellId}): spelldescription =`, JSON.stringify(spellData.spelldescription));
          console.log(`DEBUG Firestore Fetch (Arcana.tsx - ID: ${spellId}): effectdescription =`, JSON.stringify(spellData.effectdescription));
          // --- END DEBUG LOG ---

          spellsArray.push({
            id: spellId,
            ...spellData
          });
        });

        setSpells(spellsArray);
        setFilteredSpells(spellsArray);
      } catch (error) {
        console.error('Error loading spells:', error);
        toast({
          title: 'Error',
          description: 'Failed to load spells from the database',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSpells();
  }, [toast]); // Dependency array is correct

  // Filter spells based on search and filters
  useEffect(() => {
    let filtered = spells;

    if (searchTerm) {
      filtered = filtered.filter(spell =>
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (spell.spelldescription && spell.spelldescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (spell.effectdescription && spell.effectdescription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (archetypeFilter) {
      filtered = filtered.filter(spell =>
        spell.archetype && spell.archetype.toLowerCase() === archetypeFilter.toLowerCase()
      );
    }

    if (damageTypeFilter) {
      filtered = filtered.filter(spell =>
        spell.damageType && spell.damageType.toLowerCase() === damageTypeFilter.toLowerCase()
      );
    }

    setFilteredSpells(filtered);
    setPage(0); // Reset page number when filters change
  }, [searchTerm, archetypeFilter, damageTypeFilter, spells]);

  const pageCount = Math.ceil(filteredSpells.length / ITEMS_PER_PAGE);
  const displayedSpells = filteredSpells.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const uniqueArchetypes = Array.from(new Set(spells
    .filter(spell => spell.archetype)
    .map(spell => spell.archetype as string)
  )).sort();

  const uniqueDamageTypes = Array.from(new Set(spells
    .filter(spell => spell.damageType && spell.damageType !== "N/A")
    .map(spell => spell.damageType as string)
  )).sort();

  // Handle learning a spell
  const handleLearnSpell = (spell: Spell) => {
    if (isSpellLearned(spell)) {
      toast({
        title: "Already Learned",
        description: `You already know the spell "${spell.name}"`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    addToLearnedSpells(spell);

    toast({
      title: "Spell Learned",
      description: `You have learned "${spell.name}"`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
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
      <VStack spacing={4} mb={4}>
        {/* Search and Filters */}
        <HStack spacing={4} width="full">
          <Box flex={1}>
            <InputGroup>
              <InputLeftElement pointerEvents="none"> {/* Added pointerEvents */}
                <Search className="h-4 w-4 text-gray-400" />
              </InputLeftElement>
              <Input
                placeholder="Search spells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="gray.800"
                borderColor="gray.700"
                _hover={{ borderColor: "gray.600" }}
                _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
              />
            </InputGroup>
          </Box>
          <Select
            placeholder="Filter by archetype"
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ borderColor: "gray.600" }}
            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
          >
            {uniqueArchetypes.map(type => (
              <option key={`archetype-${type}`} value={type}>{type}</option>
            ))}
          </Select>
          <Select
            placeholder="Filter by damage type"
            value={damageTypeFilter}
            onChange={(e) => setDamageTypeFilter(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            _hover={{ borderColor: "gray.600" }}
            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
          >
            {uniqueDamageTypes.map(type => (
              <option key={`damage-${type}`} value={type}>{type}</option>
            ))}
          </Select>
        </HStack>

        {/* Spells Table */}
        <ScrollArea className="h-[600px] w-full">
          <Table variant="simple">
            <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
              <Tr>
                <Th color="gray.400" borderColor="gray.700">Name</Th>
                <Th color="gray.400" borderColor="gray.700">Archetype</Th>
                <Th color="gray.400" borderColor="gray.700">Damage</Th>
                <Th color="gray.400" borderColor="gray.700">Casting Time</Th>
                <Th color="gray.400" borderColor="gray.700">Mana Cost</Th>
                <Th color="gray.400" borderColor="gray.700">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedSpells.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8} borderColor="gray.700"> {/* Added borderColor */}
                    <Text color="gray.400">No spells match your search criteria</Text>
                  </Td>
                </Tr>
              ) : (
                displayedSpells.map((spell) => (
                  <Tr
                    key={spell.id || spell.name}
                    _hover={{ bg: 'gray.750' }}
                    cursor="pointer"
                    borderColor="gray.700" // Ensure border color consistency
                  >
                    <Td
                      onClick={() => {
                        setSelectedSpell(spell);
                        onOpen();
                      }}
                      color="gray.300"
                      borderColor="gray.700"
                    >
                      {spell.name}
                    </Td>
                    <Td borderColor="gray.700">
                      {spell.archetype && (
                        <Badge colorScheme="purple">{spell.archetype}</Badge>
                      )}
                    </Td>
                    <Td borderColor="gray.700" color="gray.400">
                      {formatValue(spell.damage)} {formatValue(spell.damageType)}
                    </Td>
                    <Td borderColor="gray.700" color="gray.400">{formatValue(spell.castingTime)}</Td>
                    <Td borderColor="gray.700" color="gray.400">{formatValue(spell.manaPointCost)}</Td>
                    <Td borderColor="gray.700">
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click when clicking button
                          handleLearnSpell(spell);
                        }}
                        colorScheme="brand"
                        isDisabled={isSpellLearned(spell)}
                      >
                        {isSpellLearned(spell) ? "Learned" : "Learn"}
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {pageCount > 1 && ( // Only show pagination if there's more than one page
            <HStack spacing={2} justify="center">
            <Button
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                isDisabled={page === 0}
                colorScheme="brand"
                variant="outline"
            >
                Previous
            </Button>
            <Text color="gray.400">
                Page {page + 1} of {pageCount}
            </Text>
            <Button
                size="sm"
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                isDisabled={page >= pageCount - 1}
                colorScheme="brand"
            >
                Next
            </Button>
            </HStack>
        )}
      </VStack>

      {/* Spell Detail Modal */}
      {/* Passing selectedSpell which contains the data fetched and logged above */}
      <SpellDetailModal
        spell={selectedSpell}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Box>
  );
};

export default Arcana;