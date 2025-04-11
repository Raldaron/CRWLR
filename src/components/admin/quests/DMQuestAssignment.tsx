// src/components/admin/quests/DMQuestAssignment.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  useToast,
  Heading,
  Checkbox,
  SimpleGrid,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  Input,
  Badge,
  NumberInput,
  NumberInputField,
  Center,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { Send, User, BookOpen, Search, Filter, Users, Clock } from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc, 
  serverTimestamp, 
  orderBy,
  limit,
  Timestamp, 
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import debounce from 'lodash/debounce';

// Interfaces
interface Quest {
  id: string;
  title: string;
  status?: 'available' | 'active' | 'completed' | 'failed';
  requiredLevel?: number;
  objectives?: any[];
  createdAt?: Timestamp;
  location?: string;
}

interface Player {
  id: string;
  displayName: string;
  email?: string;
}

interface Character {
  id: string;
  characterName: string;
  userId: string;
  level?: number;
}

interface QuestAssignmentData {
  questId: string;
  characterId: string;
  playerId: string;
  assignedAt: any;
  status: 'active' | 'completed' | 'failed';
  objectiveProgress?: Record<string, number>;
}

const DMQuestAssignment: React.FC = () => {
  // Data states
  const [quests, setQuests] = useState<Quest[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  
  // UI states
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [questSearchTerm, setQuestSearchTerm] = useState('');
  const [questLevelFilter, setQuestLevelFilter] = useState<number | ''>('');
  const [questStatusFilter, setQuestStatusFilter] = useState('');
  
  const toast = useToast();

  // Load Quests
  useEffect(() => {
    const loadQuests = async () => {
      setIsLoadingQuests(true);
      try {
        const q = query(collection(db, 'quests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setQuests(snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          title: docSnap.data().title || 'Untitled Quest',
          requiredLevel: docSnap.data().requiredLevel,
          status: docSnap.data().status || 'available',
          createdAt: docSnap.data().createdAt,
          location: docSnap.data().location,
          objectives: docSnap.data().objectives || []
        })));
      } catch (error) {
        console.error("Error loading quests:", error);
        toast({ title: 'Error', description: 'Failed to load quests', status: 'error' });
      } finally {
        setIsLoadingQuests(false);
      }
    };
    loadQuests();
  }, [toast]);

  // Load Players and Characters
  useEffect(() => {
    const loadPlayersAndCharacters = async () => {
      setIsLoadingPlayers(true);
      try {
        // Fetch Players
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const playersList = usersSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          displayName: docSnap.data().displayName || docSnap.data().email || 'Unknown Player',
          email: docSnap.data().email || '',
        }));
        setPlayers(playersList);

        // Fetch Characters
        const charactersSnapshot = await getDocs(collection(db, 'characters'));
        const charactersList = charactersSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            characterName: data.characterName || 'Unnamed Character',
            userId: data.userId || '',
            level: data.characterLevel || 1,
          };
        });
        
        setCharacters(charactersList);
      } catch (error) {
        console.error("Error loading players/characters:", error);
        toast({ title: 'Error', description: 'Failed to load characters', status: 'error' });
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    loadPlayersAndCharacters();
  }, [toast]);

  // Filtered quests based on search and filters
  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      const searchLower = questSearchTerm.toLowerCase();
      const matchesSearch = !searchLower || quest.title.toLowerCase().includes(searchLower);
      const matchesLevel = questLevelFilter === '' || !quest.requiredLevel || quest.requiredLevel <= questLevelFilter;
      const matchesStatus = !questStatusFilter || quest.status === questStatusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [quests, questSearchTerm, questLevelFilter, questStatusFilter]);

  // Group characters by player for display
  const charactersByPlayer = useMemo(() => {
    const grouped: Record<string, Character[]> = {};
    characters.forEach(char => {
      if (char.userId) {
        if (!grouped[char.userId]) {
          grouped[char.userId] = [];
        }
        grouped[char.userId].push(char);
      }
    });
    return grouped;
  }, [characters]);

  // Selected quest details
  const selectedQuest = useMemo(() => {
    return quests.find(q => q.id === selectedQuestId);
  }, [quests, selectedQuestId]);

  // Handle character selection
  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterIds(prev =>
      prev.includes(characterId) ? prev.filter(id => id !== characterId) : [...prev, characterId]
    );
  };

  // Handle debounced search
  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setQuestSearchTerm(value);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Assign quest to selected characters
  const handleAssignQuest = async () => {
    if (!selectedQuestId || selectedCharacterIds.length === 0) {
      toast({ 
        title: 'Selection Required', 
        description: 'Please select a quest and at least one character.', 
        status: 'warning' 
      });
      return;
    }
    
    setIsAssigning(true);
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();

      // Find quest details for notification
      const questToAssign = quests.find(q => q.id === selectedQuestId);
      if (!questToAssign) {
        throw new Error('Selected quest not found');
      }

      // Create assignment entries for each selected character
      selectedCharacterIds.forEach(charId => {
        const character = characters.find(c => c.id === charId);
        if (!character) return;

        // Prepare initial objective progress tracking
        const objectiveProgress = questToAssign.objectives?.reduce(
          (acc, obj) => ({ ...acc, [obj.id]: 0 }), 
          {}
        ) || {};

        const assignmentData: QuestAssignmentData = {
          questId: selectedQuestId,
          characterId: charId,
          playerId: character.userId,
          assignedAt: timestamp,
          status: 'active',
          objectiveProgress
        };

        // Create a new document in the questAssignments collection
        const assignmentRef = doc(collection(db, 'questAssignments'));
        batch.set(assignmentRef, assignmentData);
      });

      await batch.commit();
      
      toast({
        title: 'Quest Assigned',
        description: `"${questToAssign.title}" assigned to ${selectedCharacterIds.length} character(s)`,
        status: 'success',
        duration: 3000
      });

      // Reset selection after successful assignment
      setSelectedCharacterIds([]);
    } catch (error) {
      console.error("Error assigning quest:", error);
      toast({ 
        title: 'Assignment Failed', 
        description: 'Could not assign the quest. Please try again.', 
        status: 'error'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Get player name from userId
  const getPlayerName = (userId: string) => {
    const player = players.find(p => p.id === userId);
    return player ? player.displayName : 'Unknown Player';
  };

  return (
    <Box p={{ base: 3, md: 5 }} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
      <Heading size="md" mb={4} color="gray.200" display="flex" alignItems="center">
        <Send size={18} className="mr-2" /> Assign Quest
      </Heading>
      
      {isLoadingQuests || isLoadingPlayers ? (
        <Center py={10}>
          <VStack spacing={3}>
            <Spinner size="xl" color="brand.400" />
            <Text color="gray.400">Loading data...</Text>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 8 }}>
          {/* Left Column: Quest Selection */}
          <VStack spacing={4} align="stretch">
            <Heading size="sm" color="gray.300">1. Select Quest</Heading>
            
            {/* Search and filters */}
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Search size={16} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search quests by title..."
                onChange={handleSearchChange}
                bg="gray.700" 
                borderColor="gray.600"
                pl={8}
              />
            </InputGroup>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <FormControl size="sm">
                <FormLabel fontSize="xs" color="gray.400" mb={1}>Min Level</FormLabel>
                <NumberInput
                  value={questLevelFilter}
                  onChange={(_, valueAsNumber) => setQuestLevelFilter(isNaN(valueAsNumber) ? '' : valueAsNumber)}
                  min={1}
                  bg="gray.700" 
                  borderColor="gray.600"
                  size="sm"
                >
                  <NumberInputField placeholder="Any" />
                </NumberInput>
              </FormControl>
              
              <FormControl size="sm">
                <FormLabel fontSize="xs" color="gray.400" mb={1}>Status</FormLabel>
                <Select
                  placeholder="Any Status"
                  value={questStatusFilter}
                  onChange={(e) => setQuestStatusFilter(e.target.value)}
                  bg="gray.700" 
                  borderColor="gray.600"
                  size="sm"
                >
                  <option value="available">Available</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Select>
              </FormControl>
            </SimpleGrid>
            
            {/* Quest selector */}
            <FormControl isRequired>
              <FormLabel color="gray.300" fontSize="sm">Available Quests</FormLabel>
              <Select
                placeholder="Choose a quest..."
                value={selectedQuestId}
                onChange={(e) => setSelectedQuestId(e.target.value)}
                bg="gray.700" 
                borderColor="gray.600"
              >
                {filteredQuests.length === 0 ? (
                  <option disabled value="">No quests match filters</option>
                ) : (
                  filteredQuests.map(quest => (
                    <option key={quest.id} value={quest.id}>
                      {quest.title} {quest.requiredLevel ? `(Lvl ${quest.requiredLevel})` : ''}
                    </option>
                  ))
                )}
              </Select>
            </FormControl>
            
            {/* Selected quest details */}
            {selectedQuest && (
              <Box p={3} bg="gray.750" borderRadius="md" mt={2}>
                <Text fontWeight="bold" color="gray.300">{selectedQuest.title}</Text>
                <Flex wrap="wrap" gap={2} mt={2}>
                  {selectedQuest.requiredLevel && (
                    <Badge colorScheme="blue">Level {selectedQuest.requiredLevel}+</Badge>
                  )}
                  {selectedQuest.status && (
                    <Badge colorScheme={
                      selectedQuest.status === 'available' ? 'green' :
                      selectedQuest.status === 'active' ? 'blue' :
                      selectedQuest.status === 'completed' ? 'purple' : 'red'
                    }>
                      {selectedQuest.status}
                    </Badge>
                  )}
                  {selectedQuest.location && (
                    <Badge colorScheme="orange">{selectedQuest.location}</Badge>
                  )}
                </Flex>
                <Text fontSize="sm" color="gray.400" mt={2}>
                  Objectives: {selectedQuest.objectives?.length || 0}
                </Text>
              </Box>
            )}
          </VStack>

          {/* Right Column: Character Selection */}
          <VStack spacing={4} align="stretch">
            <Heading size="sm" color="gray.300">2. Select Characters</Heading>
            
            <Box position="relative">
              <FormControl>
                <FormLabel color="gray.300" fontSize="sm">
                  Characters ({selectedCharacterIds.length} selected)
                </FormLabel>
                
                <ScrollArea className="h-[350px] border border-gray-600 rounded-md p-3 bg-gray-750">
                  {Object.keys(charactersByPlayer).length === 0 ? (
                    <Center py={8}>
                      <Alert status="info" variant="subtle">
                        <AlertIcon />
                        <Text>No characters found. Create characters first.</Text>
                      </Alert>
                    </Center>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      {players.map(player => {
                        const playerCharacters = charactersByPlayer[player.id] || [];
                        if (playerCharacters.length === 0) return null;

                        return (
                          <Box key={player.id}>
                            <HStack mb={1}>
                              <User size={14} color="gray.400" />
                              <Text fontWeight="semibold" fontSize="sm" color="gray.400">
                                {player.displayName}
                              </Text>
                            </HStack>
                            
                            <VStack align="stretch" pl={4} spacing={1}>
                              {playerCharacters.map(character => (
                                <Checkbox
                                  key={character.id}
                                  isChecked={selectedCharacterIds.includes(character.id)}
                                  onChange={() => handleCharacterSelect(character.id)}
                                  colorScheme="brand"
                                  size="sm"
                                >
                                  <HStack spacing={2}>
                                    <Text color="gray.200" fontSize="sm">
                                      {character.characterName}
                                    </Text>
                                    <Badge colorScheme="teal" fontSize="xs">
                                      Lvl {character.level}
                                    </Badge>
                                  </HStack>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </ScrollArea>
              </FormControl>
            </Box>
            
            {/* Quick selection count */}
            {selectedCharacterIds.length > 0 && (
              <HStack mt={1} color="gray.400" fontSize="sm">
                <Users size={14} />
                <Text>{selectedCharacterIds.length} character(s) selected</Text>
              </HStack>
            )}
          </VStack>
          
          {/* Assignment Button - Spanning both columns */}
          <Box gridColumn={{ base: "1", md: "1 / -1" }} mt={4}>
            <Button
              colorScheme="brand"
              onClick={handleAssignQuest}
              isLoading={isAssigning}
              loadingText="Assigning..."
              isDisabled={!selectedQuestId || selectedCharacterIds.length === 0}
              leftIcon={<Send size={18} />}
              w={{ base: "full", md: "auto" }}
              size={{ base: "md", md: "lg" }}
            >
              Assign Quest to {selectedCharacterIds.length || 'Selected'} Character(s)
            </Button>
          </Box>
        </SimpleGrid>
      )}
    </Box>
  );
};

export default DMQuestAssignment;