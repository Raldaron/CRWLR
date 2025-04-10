// components/admin/quests/DMQuestAssignment.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, VStack, HStack, Select, Button, Spinner, useToast, Heading, Text, Checkbox, SimpleGrid,
    FormControl, FormLabel, InputGroup, InputLeftElement, Input, Badge, NumberInput, NumberInputField,
    Center, Divider
} from '@chakra-ui/react';
import { Send, User, BookOpen, Search, Filter, Check, Users, Hash, Calendar } from 'lucide-react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, writeBatch, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interfaces
interface Quest {
    id: string;
    title: string;
    suggestedLevel?: number;
    status?: 'available' | 'active' | 'completed' | 'failed'; // Added status
    createdAt?: Timestamp; // Added createdAt
}
interface Player {
    id: string; // User ID from Auth
    displayName: string;
    email?: string;
}
interface Character {
    id: string; // Character document ID
    characterName: string;
    userId: string;
    level?: number; // Added level
}
// Define the structure for QuestAssignment data
interface QuestAssignmentData {
    questId: string;
    characterId: string;
    playerId: string; // User ID associated with the character
    assignedAt: any; // Firestore server timestamp
    status: 'active' | 'completed' | 'failed'; // Initial status
    progress?: Record<string, number>; // Optional progress tracking
}


const DMQuestAssignment: React.FC = () => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]); // All characters
    const [selectedQuestId, setSelectedQuestId] = useState('');
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [isLoadingQuests, setIsLoadingQuests] = useState(true);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    // Filter states for quests
    const [questSearchTerm, setQuestSearchTerm] = useState('');
    const [questLevelFilter, setQuestLevelFilter] = useState<number | ''>('');
    const [questStatusFilter, setQuestStatusFilter] = useState<string>('');

    const toast = useToast();

    // Load Quests
    useEffect(() => {
        const loadQuests = async () => {
            setIsLoadingQuests(true);
            try {
                // Query quests, order by creation time descending for relevance
                const q = query(collection(db, 'quests'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setQuests(snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    title: docSnap.data().title || 'Untitled Quest',
                    suggestedLevel: docSnap.data().suggestedLevel,
                    status: docSnap.data().status || 'available',
                    createdAt: docSnap.data().createdAt,
                })));
            } catch (error) {
                console.error("Error loading quests:", error);
                toast({ title: 'Error Loading Quests', status: 'error', duration: 3000 });
            } finally {
                setIsLoadingQuests(false);
            }
        };
        loadQuests();
    }, [toast]);

    // Load Players and Characters (Keeping fetch-all approach for now)
    useEffect(() => {
        const loadPlayersAndCharacters = async () => {
            setIsLoadingPlayers(true);
            try {
                // Fetch Players
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const playersList = usersSnapshot.docs.map(docSnap => ({
                    id: docSnap.id, // User ID
                    displayName: docSnap.data().displayName || docSnap.data().email || 'Unknown Player',
                    email: docSnap.data().email || 'N/A',
                }));
                setPlayers(playersList);

                // Fetch All Characters
                const charactersSnapshot = await getDocs(collection(db, 'characters'));
                const charactersList = charactersSnapshot.docs.map(docSnap => ({
                    id: docSnap.id, // Character ID
                    characterName: docSnap.data().characterName || 'Unnamed Character',
                    userId: docSnap.data().userId,
                    level: docSnap.data().characterLevel || 1,
                }));
                setCharacters(charactersList);

            } catch (error) {
                console.error("Error loading players/characters:", error);
                toast({ title: 'Error Loading Players/Characters', status: 'error', duration: 3000 });
            } finally {
                setIsLoadingPlayers(false);
            }
        };
        loadPlayersAndCharacters();
    }, [toast]);

    // Filtered Quests - Updated with search, level, and status filters
    const filteredQuests = useMemo(() => {
        return quests.filter(quest => {
            const searchLower = questSearchTerm.toLowerCase();
            const matchesSearch = !searchLower || quest.title.toLowerCase().includes(searchLower);
            // Level filter: Show quests with suggestedLevel >= filter value OR quests without a suggestedLevel
            const matchesLevel = questLevelFilter === '' || !quest.suggestedLevel || quest.suggestedLevel >= questLevelFilter;
            const matchesStatus = !questStatusFilter || quest.status === questStatusFilter;
            return matchesSearch && matchesLevel && matchesStatus;
        }); // Sorting is done in the initial fetch
    }, [quests, questSearchTerm, questLevelFilter, questStatusFilter]);

    // Character selection handler
    const handleCharacterSelect = (characterId: string) => {
        setSelectedCharacterIds(prev =>
            prev.includes(characterId) ? prev.filter(id => id !== characterId) : [...prev, characterId]
        );
    };

    // Assign Quest Handler - Uses Batch Write
    const handleAssignQuest = async () => {
        if (!selectedQuestId || selectedCharacterIds.length === 0) {
            toast({ title: 'Selection Required', description: 'Please select a quest and at least one character.', status: 'warning', duration: 3000 });
            return;
        }
        setIsAssigning(true);
        try {
            const questToAssign = quests.find(q => q.id === selectedQuestId);
            if (!questToAssign) {
                toast({ title: 'Error', description: 'Selected quest not found.', status: 'error', duration: 3000 });
                setIsAssigning(false);
                return;
            }

            const batch = writeBatch(db);
            const timestamp = serverTimestamp();

            selectedCharacterIds.forEach(charId => {
                const character = characters.find(c => c.id === charId);
                if (!character) {
                    console.warn(`Character with ID ${charId} not found during assignment.`);
                    return; // Skip if character data isn't available
                }

                const assignmentData: QuestAssignmentData = {
                    questId: selectedQuestId,
                    characterId: charId,
                    playerId: character.userId,
                    assignedAt: timestamp,
                    status: 'active',
                    // Initialize progress if needed, based on quest objectives (future enhancement)
                    // progress: {},
                };
                const assignmentRef = doc(collection(db, 'questAssignments')); // Generate new doc ref
                batch.set(assignmentRef, assignmentData);
            });

            await batch.commit();

            toast({
                title: 'Quest Assigned',
                description: `"${questToAssign.title}" assigned to ${selectedCharacterIds.length} character(s).`,
                status: 'success',
                duration: 3000
            });
            setSelectedCharacterIds([]); // Reset character selection
            // Optionally reset quest selection too: setSelectedQuestId('');
        } catch (error) {
            console.error("Error assigning quest:", error);
            toast({ title: 'Error Assigning Quest', description: `Could not assign quest. ${error instanceof Error ? error.message : ''}`, status: 'error', duration: 3000 });
        } finally {
            setIsAssigning(false);
        }
    };

    // Group characters by player for display
    const charactersByPlayer = useMemo(() => {
        const grouped: { [playerId: string]: Character[] } = {};
        characters.forEach(char => {
            if (!grouped[char.userId]) {
                grouped[char.userId] = [];
            }
            grouped[char.userId].push(char);
        });
        return grouped;
    }, [characters]);

    return (
        <Box p={5} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
            <Heading size="md" mb={4} color="gray.200" display="flex" alignItems="center">
                <BookOpen className="mr-2 text-brand-400"/> Assign Quest
            </Heading>
            {isLoadingQuests || isLoadingPlayers ? (
                <Center py={10}><Spinner color="brand.400" size="xl"/></Center>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Left Column: Quest Selection & Filters */}
                    <VStack spacing={4} align="stretch">
                        <Heading size="sm" color="gray.300">1. Select Quest</Heading>
                         <InputGroup size="sm">
                             <InputLeftElement pointerEvents='none'>
                                 <Search size={16} color='gray.500' />
                             </InputLeftElement>
                             <Input
                                placeholder='Search quests by title...'
                                value={questSearchTerm}
                                onChange={(e) => setQuestSearchTerm(e.target.value)}
                                bg="gray.700" borderColor="gray.600" pl={8}
                            />
                        </InputGroup>
                        <HStack spacing={2}>
                             <FormControl size="sm">
                                <FormLabel fontSize="xs" color="gray.400" mb={1}>Min Level</FormLabel>
                                <NumberInput
                                    value={questLevelFilter}
                                    onChange={(_, valueAsNumber) => setQuestLevelFilter(isNaN(valueAsNumber) ? '' : valueAsNumber)}
                                    min={1}
                                    bg="gray.700" borderColor="gray.600"
                                    size="sm"
                                    allowMouseWheel
                                >
                                    <NumberInputField placeholder="Any" />
                                </NumberInput>
                             </FormControl>
                             <FormControl size="sm">
                                 <FormLabel fontSize="xs" color="gray.400" mb={1}>Status</FormLabel>
                                 <Select
                                    placeholder='Any Status'
                                    value={questStatusFilter}
                                    onChange={(e) => setQuestStatusFilter(e.target.value)}
                                    bg="gray.700" borderColor="gray.600" size="sm" icon={<Filter size={14}/>}
                                >
                                    <option value='available'>Available</option>
                                    <option value='active'>Active</option>
                                    <option value='completed'>Completed</option>
                                    <option value='failed'>Failed</option>
                                </Select>
                             </FormControl>
                        </HStack>
                        <FormControl isRequired>
                            <FormLabel color="gray.300" fontSize="sm">Available Quests</FormLabel>
                             <Select
                                placeholder="Choose a quest..."
                                value={selectedQuestId}
                                onChange={(e) => setSelectedQuestId(e.target.value)}
                                bg="gray.700" borderColor="gray.600"
                                icon={<BookOpen size={16} />}
                            >
                                {filteredQuests.length === 0 && <option disabled>No quests match filters</option>}
                                {filteredQuests.map(q => (
                                    <option key={q.id} value={q.id} style={{ backgroundColor: "#2D3748", color: "#E2E8F0" }}>
                                        {q.title} {q.suggestedLevel ? `(Lvl ${q.suggestedLevel})` : ''}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                         {selectedQuestId && quests.find(q => q.id === selectedQuestId) && (
                            <Box p={2} bg="gray.750" borderRadius="md" mt={2}>
                                <Text fontSize="sm" color="gray.300">
                                    Selected: <strong>{quests.find(q => q.id === selectedQuestId)?.title}</strong>
                                </Text>
                                 <Text fontSize="xs" color="gray.400">
                                     Level: {quests.find(q => q.id === selectedQuestId)?.suggestedLevel || 'Any'} | Status: {quests.find(q => q.id === selectedQuestId)?.status || 'N/A'}
                                 </Text>
                             </Box>
                        )}
                    </VStack>

                    {/* Right Column: Character Selection */}
                    <VStack spacing={4} align="stretch">
                         <Heading size="sm" color="gray.300">2. Select Characters</Heading>
                         <FormControl>
                             <FormLabel color="gray.300" fontSize="sm">Characters ({selectedCharacterIds.length} selected)</FormLabel>
                             <ScrollArea className="h-[350px] border border-gray-600 rounded-md p-3 bg-gray.750">
                                 {players.length === 0 ? (
                                     <Center h="100px"><Text color="gray.500">No players found.</Text></Center>
                                 ) : (
                                     <VStack align="stretch" spacing={3}>
                                        {players.map(player => {
                                            const playerCharacters = charactersByPlayer[player.id] || [];
                                            if (playerCharacters.length === 0) return null; // Skip players with no characters

                                            return (
                                                <Box key={player.id}>
                                                     <Text fontWeight="semibold" fontSize="sm" color="gray.400" mb={1} display="flex" alignItems="center">
                                                         <User size={14} className="mr-1"/> {player.displayName}
                                                     </Text>
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
                                                                    <Text color="gray.200" fontSize="sm">{character.characterName}</Text>
                                                                    <Badge colorScheme="teal" fontSize="xs">Lvl {character.level}</Badge>
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
                     </VStack>

                     {/* Assignment Button - Spanning both columns on small screens */}
                     <Box gridColumn={{ base: "1", md: "1 / -1" }} mt={4}>
                        <Button
                            colorScheme="brand"
                            onClick={handleAssignQuest}
                            isLoading={isAssigning}
                            loadingText="Assigning..."
                            isDisabled={!selectedQuestId || selectedCharacterIds.length === 0 || isAssigning}
                            leftIcon={<Send size={18} />}
                            w="full"
                        >
                            Assign Quest to {selectedCharacterIds.length} Character(s)
                        </Button>
                    </Box>
                </SimpleGrid>
            )}
        </Box>
    );
};

export default DMQuestAssignment;