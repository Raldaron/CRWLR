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
} from '@chakra-ui/react';
import { Search, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SpellDetailModal from '@/components/Modals/SpellDetailModal';
import { useCharacter } from '@/context/CharacterContext';
import { Spell } from '@/types/spell';

const ITEMS_PER_PAGE = 10;

const Arcana = () => {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [page, setPage] = useState(0);
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [damageTypeFilter, setDamageTypeFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { addToLearnedSpells, learnedSpells } = useCharacter();

  // Format display value - replace "N/A" with "-"
  const formatValue = (value: string) => {
    return value === "N/A" ? "-" : value;
  };

  // Check if a spell is already learned
  const isSpellLearned = (spell: Spell) => {
    return learnedSpells.some(s => s.name === spell.name);
  };

  // Load spells data
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const response = await fetch('/data/spells.json');
        const data = await response.json();
        const spellsArray = Object.values(data.spells) as Spell[];
        setSpells(spellsArray);
        setFilteredSpells(spellsArray);
      } catch (error) {
        console.error('Error loading spells:', error);
      }
    };

    loadSpells();
  }, []);

  // Filter spells based on search and filters
  useEffect(() => {
    let filtered = spells;

    if (searchTerm) {
      filtered = filtered.filter(spell =>
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (archetypeFilter) {
      filtered = filtered.filter(spell =>
        spell.archetype.toLowerCase() === archetypeFilter.toLowerCase()
      );
    }

    if (damageTypeFilter) {
      filtered = filtered.filter(spell =>
        spell.damageType.toLowerCase() === damageTypeFilter.toLowerCase()
      );
    }

    setFilteredSpells(filtered);
    setPage(0);
  }, [searchTerm, archetypeFilter, damageTypeFilter, spells]);

  const pageCount = Math.ceil(filteredSpells.length / ITEMS_PER_PAGE);
  const displayedSpells = filteredSpells.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const uniqueArchetypes = Array.from(new Set(spells.map(spell => spell.archetype)));
  const uniqueDamageTypes = Array.from(new Set(spells.map(spell => spell.damageType)))
    .filter(type => type !== "N/A");

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

  return (
    <Box p={4}>
      <VStack spacing={4} mb={4}>
        {/* Search and Filters */}
        <HStack spacing={4} width="full">
          <Box flex={1}>
            <InputGroup>
              <InputLeftElement>
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
                <Th color="gray.400" borderColor="gray.700">AP Cost</Th>
                <Th color="gray.400" borderColor="gray.700">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedSpells.map((spell) => (
                <Tr
                  key={spell.id || spell.name}
                  _hover={{ bg: 'gray.750' }}
                  cursor="pointer"
                  borderColor="gray.700"
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
                    <Badge colorScheme="purple">{spell.archetype}</Badge>
                  </Td>
                  <Td borderColor="gray.700" color="gray.400">
                    {formatValue(spell.damage)} {formatValue(spell.damageType)}
                  </Td>
                  <Td borderColor="gray.700" color="gray.400">{formatValue(spell.castingTime)}</Td>
                  <Td borderColor="gray.700" color="gray.400">{formatValue(spell.abilityPointCost)}</Td>
                  <Td borderColor="gray.700">
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLearnSpell(spell);
                      }}
                      colorScheme="brand"
                      isDisabled={isSpellLearned(spell)}
                    >
                      {isSpellLearned(spell) ? "Learned" : "Learn"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
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
            Page {page + 1} of {pageCount || 1}
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
      </VStack>

      {/* Spell Detail Modal */}
      <SpellDetailModal
        spell={selectedSpell}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Box>
  );
};

export default Arcana;