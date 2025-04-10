// components/admin/DMCharacterManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Heading,
    Text,
    Button,
    Spinner,
    useToast,
    SimpleGrid,
    Flex,
    HStack,
    Badge,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Input,
    Select,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    FormControl,
    FormLabel,
    InputGroup,
    InputLeftElement,
    Divider,
    Alert,
    AlertIcon,
    InputRightElement,
} from '@chakra-ui/react';
import {
    Users,
    Search,
    User,
    Shield,
    PlusCircle,
    Edit,
    Trash,
    Save,
    Clock,
    Star,
    Coins
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';


// Types
interface Character {
    id: string;
    characterName: string;
    characterLevel: number;
    userId: string;
    selectedRace?: {
        name: string;
        description?: string;
    } | null;
    selectedClass?: {
        name: string;
        archetype?: string;
    } | null;
    createdAt?: number;
    lastUpdated?: number;
    baseStats?: {
        strength: number;
        dexterity: number;
        stamina: number;
        intelligence: number;
        perception: number;
        wit: number;
        charisma: number;
    };
    currentHp?: number;
    maxHp?: number;
    currentMp?: number;
    maxMp?: number;
    currentAp?: number;
    maxAp?: number;
    gold?: number; // Add gold property to the Character interface
}

interface User {
    id: string;
    email?: string;
    displayName?: string;
    lastLogin?: number;
    createdAt?: number;
}

const DEFAULT_BASE_STATS = {
    strength: 1,
    dexterity: 1,
    stamina: 1,
    intelligence: 1,
    perception: 1,
    wit: 1,
    charisma: 1
};

// The main component
const DMCharacterManager: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

    // State variables
    const [users, setUsers] = useState<User[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Editable character state
    const [editableCharacter, setEditableCharacter] = useState<Character | null>(null);

    // References for dialogs
    const cancelRef = React.useRef<HTMLButtonElement>(null!);

    // Fetch all users and their characters
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            setIsLoading(true);
            try {
                // Fetch all users
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const fetchedUsers: User[] = [];

                usersSnapshot.forEach(doc => {
                    fetchedUsers.push({
                        id: doc.id,
                        ...doc.data() as Omit<User, 'id'>
                    });
                });

                setUsers(fetchedUsers);

                // Fetch all characters
                const charactersSnapshot = await getDocs(collection(db, 'characters'));
                const fetchedCharacters: Character[] = [];

                charactersSnapshot.forEach(doc => {
                    fetchedCharacters.push({
                        id: doc.id,
                        ...doc.data() as Omit<Character, 'id'>
                    });
                });

                // Sort characters by last updated (newest first)
                fetchedCharacters.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

                setCharacters(fetchedCharacters);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load users and characters',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, toast]);

    // Filter users based on search term
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (user.email?.toLowerCase().includes(searchLower) || false) ||
            (user.displayName?.toLowerCase().includes(searchLower) || false)
        );
    });

    // Get characters for selected user
    const userCharacters = selectedUser
        ? characters.filter(char => char.userId === selectedUser.id)
        : [];

    // Format date for display
    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString();
    };

    // Handle selecting a user
    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSelectedCharacter(null);
    };

    // Handle selecting a character
    const handleSelectCharacter = (character: Character) => {
        setSelectedCharacter(character);
        setEditableCharacter({ ...character });
    };

    // Handle creating a new character
    const handleCreateCharacter = () => {
        if (!selectedUser) return;

        const newCharacter: Character = {
            id: '', // Will be assigned by Firestore
            characterName: `New Character for ${selectedUser.displayName || selectedUser.email}`,
            characterLevel: 1,
            userId: selectedUser.id,
            selectedRace: null,
            selectedClass: null,
            baseStats: { ...DEFAULT_BASE_STATS },
            currentHp: 10,
            maxHp: 10,
            currentMp: 5,
            maxMp: 5,
            currentAp: 2,
            maxAp: 2,
            gold: 0, // Add default gold value for new characters
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };

        setSelectedCharacter(null);
        setEditableCharacter(newCharacter);
        setIsCreating(true);
    };

    // Handle editing a character
    const handleEditCharacter = () => {
        if (!selectedCharacter) return;
        setIsEditing(true);
    };

    // Handle deleting a character
    const handleDeleteCharacter = async () => {
        if (!selectedCharacter) return;

        setIsSaving(true);
        try {
            // Delete the character document
            await deleteDoc(doc(db, 'characters', selectedCharacter.id));

            // Update local state
            setCharacters(characters.filter(char => char.id !== selectedCharacter.id));

            toast({
                title: 'Character Deleted',
                description: `${selectedCharacter.characterName} has been deleted`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setSelectedCharacter(null);
            setIsDeleting(false);
        } catch (error) {
            console.error('Error deleting character:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete character',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle saving changes to a character
    const handleSaveCharacter = async () => {
        if (!editableCharacter) return;

        setIsSaving(true);
        try {
            const now = Date.now();
            const characterData = {
                ...editableCharacter,
                lastUpdated: now
            };

            // Remove the id field as it's used in the document path
            const { id, ...dataToSave } = characterData;

            if (isCreating) {
                // Create a new character document
                const docRef = await addDoc(collection(db, 'characters'), {
                    ...dataToSave,
                    createdAt: now
                });

                // Update local state
                const newCharacter = {
                    ...characterData,
                    id: docRef.id,
                    createdAt: now
                };

                setCharacters([newCharacter, ...characters]);
                setSelectedCharacter(newCharacter);

                toast({
                    title: 'Character Created',
                    description: `${editableCharacter.characterName} has been created`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                // Update existing character document
                await updateDoc(doc(db, 'characters', id), dataToSave);

                // Update local state
                const updatedCharacters = characters.map(char =>
                    char.id === id ? { ...characterData, id } : char
                );

                setCharacters(updatedCharacters);
                setSelectedCharacter({ ...characterData, id });

                toast({
                    title: 'Character Updated',
                    description: `${editableCharacter.characterName} has been updated`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }

            setIsEditing(false);
            setIsCreating(false);
        } catch (error) {
            console.error('Error saving character:', error);
            toast({
                title: 'Error',
                description: 'Failed to save character',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle canceling edits
    const handleCancelEdit = () => {
        if (isCreating) {
            setEditableCharacter(null);
        } else if (selectedCharacter) {
            setEditableCharacter(selectedCharacter ? { ...selectedCharacter } : null);
        }

        setIsEditing(false);
        setIsCreating(false);
    };

    // Handle input changes for editable character
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editableCharacter) return;

        const { name, value } = e.target;

        // Handle nested properties
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEditableCharacter({
                ...editableCharacter,
                [parent]: {
                    ...(editableCharacter[parent as keyof Character] as object || {}),
                    [child]: value
                }
            });
        } else if (name === 'characterLevel' || name === 'gold') {
            // Handle numeric values
            setEditableCharacter({
                ...editableCharacter,
                [name]: parseInt(value) || 0
            });
        } else {
            // Handle simple properties
            setEditableCharacter({
                ...editableCharacter,
                [name]: value
            });
        }
    };

    // Handle stat changes
    const handleStatChange = (stat: keyof typeof DEFAULT_BASE_STATS, value: number) => {
        if (!editableCharacter || !editableCharacter.baseStats) return;

        setEditableCharacter({
            ...editableCharacter,
            baseStats: {
                ...editableCharacter.baseStats,
                [stat]: value
            }
        });
    };

    return (
        <Box minH="100vh" bg="gray.900" p={6}>
            <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
                <Flex justify="space-between" align="center">
                    <Heading color="brand.300" size="lg" display="flex" alignItems="center">
                        <Shield className="mr-2" />
                        DM Character Manager
                    </Heading>

                    <Button
                        as={Link}
                        href="/character-manager"
                        variant="outline"
                        colorScheme="gray"
                    >
                        Back to Character Manager
                    </Button>
                </Flex>

                <Text color="gray.400">
                    Create and edit characters for all players in your game.
                </Text>

                {isLoading ? (
                    <Flex justify="center" align="center" h="300px">
                        <Spinner size="xl" color="brand.400" />
                    </Flex>
                ) : (
                    <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                        {/* Left panel - User list */}
                        <Box w={{ base: '100%', md: '300px' }} bg="gray.800" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.700">
                            <VStack align="stretch" spacing={4}>
                                <Heading size="md" color="gray.200">Players</Heading>

                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search players..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        bg="gray.750"
                                        borderColor="gray.600"
                                    />
                                </InputGroup>

                                <ScrollArea className="h-[500px]">
                                    <VStack spacing={2} align="stretch">
                                        {filteredUsers.length === 0 ? (
                                            <Text color="gray.400" textAlign="center" py={4}>
                                                No players found
                                            </Text>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <DarkThemedCard
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    isSelected={selectedUser?.id === user.id}
                                                    borderColor={selectedUser?.id === user.id ? "brand.600" : "gray.700"}
                                                    p={3}
                                                    height="auto"
                                                >
                                                    <VStack align="start" spacing={1}>
                                                        <HStack>
                                                            <User size={16} className="text-brand-400" />
                                                            <Text fontWeight="medium" color="gray.200">
                                                                {user.displayName || 'Unnamed Player'}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="gray.400">{user.email}</Text>
                                                        <Text fontSize="xs" color="gray.500">
                                                            Last login: {formatDate(user.lastLogin)}
                                                        </Text>
                                                        <Badge colorScheme="purple">
                                                            {characters.filter(c => c.userId === user.id).length} characters
                                                        </Badge>
                                                    </VStack>
                                                </DarkThemedCard>
                                            ))
                                        )}
                                    </VStack>
                                </ScrollArea>
                            </VStack>
                        </Box>

                        {/* Middle panel - Character list */}
                        <Box flex="1" bg="gray.800" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.700">
                            <VStack align="stretch" spacing={4}>
                                <Flex justify="space-between" align="center">
                                    <Heading size="md" color="gray.200">
                                        {selectedUser ?
                                            `Characters for ${selectedUser.displayName || selectedUser.email}` :
                                            'Select a player'
                                        }
                                    </Heading>

                                    {selectedUser && (
                                        <Button
                                            size="sm"
                                            colorScheme="brand"
                                            leftIcon={<PlusCircle size={16} />}
                                            onClick={handleCreateCharacter}
                                            isDisabled={isEditing || isCreating}
                                        >
                                            Create Character
                                        </Button>
                                    )}
                                </Flex>

                                {selectedUser ? (
                                    <>
                                        {userCharacters.length === 0 ? (
                                            <Flex
                                                direction="column"
                                                align="center"
                                                justify="center"
                                                h="200px"
                                                border="1px dashed"
                                                borderColor="gray.600"
                                                borderRadius="md"
                                                p={6}
                                            >
                                                <Text color="gray.400" mb={4}>
                                                    This player has no characters yet
                                                </Text>
                                                <Button
                                                    colorScheme="brand"
                                                    leftIcon={<PlusCircle size={16} />}
                                                    onClick={handleCreateCharacter}
                                                >
                                                    Create First Character
                                                </Button>
                                            </Flex>
                                        ) : (
                                            <ScrollArea className="h-[500px]">
                                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                                                    {userCharacters.map(character => (
                                                        <DarkThemedCard
                                                            key={character.id}
                                                            onClick={() => handleSelectCharacter(character)}
                                                            isSelected={selectedCharacter?.id === character.id}
                                                            borderColor={selectedCharacter?.id === character.id ? "accent.600" : "gray.700"}
                                                            p={4}
                                                            height="auto"
                                                        >
                                                            <VStack align="start" spacing={2}>
                                                                <Flex justify="space-between" width="100%">
                                                                    <Text fontWeight="bold" color="gray.200">{character.characterName}</Text>
                                                                    <Badge colorScheme="teal">Level {character.characterLevel}</Badge>
                                                                </Flex>

                                                                <HStack spacing={2} wrap="wrap">
                                                                    {character.selectedRace && (
                                                                        <Badge colorScheme="green">{character.selectedRace.name}</Badge>
                                                                    )}
                                                                    {character.selectedClass && (
                                                                        <Badge colorScheme="purple">{character.selectedClass.name}</Badge>
                                                                    )}
                                                                </HStack>

                                                                {/* Add gold display to character card */}
                                                                <HStack>
                                                                    <Coins size={14} className="text-amber-400" />
                                                                    <Text fontSize="sm" color="amber.300">
                                                                        {character.gold !== undefined ? character.gold : 0} gold
                                                                    </Text>
                                                                </HStack>

                                                                <HStack fontSize="xs" color="gray.500" spacing={4}>
                                                                    <HStack>
                                                                        <Clock size={12} />
                                                                        <Text>Created: {formatDate(character.createdAt)}</Text>
                                                                    </HStack>
                                                                    <HStack>
                                                                        <Clock size={12} />
                                                                        <Text>Updated: {formatDate(character.lastUpdated)}</Text>
                                                                    </HStack>
                                                                </HStack>
                                                            </VStack>
                                                        </DarkThemedCard>
                                                    ))}
                                                </SimpleGrid>
                                            </ScrollArea>
                                        )}
                                    </>
                                ) : (
                                    <Flex
                                        direction="column"
                                        align="center"
                                        justify="center"
                                        h="200px"
                                    >
                                        <Text color="gray.400">
                                            Select a player to view their characters
                                        </Text>
                                    </Flex>
                                )}
                            </VStack>
                        </Box>

                        {/* Right panel - Character details/edit */}
                        {(selectedCharacter || isCreating) && (
                            <Box w={{ base: '100%', md: '400px' }} bg="gray.800" borderRadius="md" p={4} borderWidth="1px" borderColor="gray.700">
                                <VStack align="stretch" spacing={4}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="md" color="gray.200">
                                            {isCreating ? 'Create Character' : (isEditing ? 'Edit Character' : 'Character Details')}
                                        </Heading>

                                        {!isEditing && !isCreating && (
                                            <HStack>
                                                <Button
                                                    size="sm"
                                                    colorScheme="brand"
                                                    leftIcon={<Edit size={16} />}
                                                    onClick={handleEditCharacter}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme="accent"
                                                    variant="outline"
                                                    leftIcon={<Trash size={16} />}
                                                    onClick={() => setIsDeleting(true)}
                                                >
                                                    Delete
                                                </Button>
                                            </HStack>
                                        )}

                                        {(isEditing || isCreating) && (
                                            <HStack>
                                                <Button
                                                    size="sm"
                                                    colorScheme="brand"
                                                    leftIcon={<Save size={16} />}
                                                    onClick={handleSaveCharacter}
                                                    isLoading={isSaving}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    colorScheme="gray"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </Button>
                                            </HStack>
                                        )}
                                    </Flex>

                                    <ScrollArea className="h-[500px] pr-4">
                                        {(isEditing || isCreating) && editableCharacter ? (
                                            <VStack spacing={4} align="stretch">
                                                <FormControl>
                                                    <FormLabel color="gray.300">Character Name</FormLabel>
                                                    <Input
                                                        name="characterName"
                                                        value={editableCharacter.characterName}
                                                        onChange={handleInputChange}
                                                        bg="gray.750"
                                                        borderColor="gray.600"
                                                    />
                                                </FormControl>

                                                <FormControl>
                                                    <FormLabel color="gray.300">Character Level</FormLabel>
                                                    <Input
                                                        name="characterLevel"
                                                        type="number"
                                                        value={editableCharacter.characterLevel}
                                                        onChange={handleInputChange}
                                                        bg="gray.750"
                                                        borderColor="gray.600"
                                                    />
                                                </FormControl>

                                                {/* Add Gold Field */}
                                                <FormControl>
                                                    <FormLabel color="gray.300">Gold</FormLabel>
                                                    <InputGroup>
                                                        <Input
                                                            name="gold"
                                                            type="number"
                                                            value={editableCharacter.gold || 0}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                        <InputRightElement>
                                                            <Coins size={16} className="text-amber-400" />
                                                        </InputRightElement>
                                                    </InputGroup>
                                                </FormControl>

                                                <Divider borderColor="gray.700" />

                                                <Heading size="sm" color="gray.300">Race & Class</Heading>

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <FormControl>
                                                        <FormLabel color="gray.300">Race Name</FormLabel>
                                                        <Input
                                                            name="selectedRace.name"
                                                            value={editableCharacter.selectedRace?.name || ''}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Class Name</FormLabel>
                                                        <Input
                                                            name="selectedClass.name"
                                                            value={editableCharacter.selectedClass?.name || ''}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Race Description</FormLabel>
                                                        <Input
                                                            name="selectedRace.description"
                                                            value={editableCharacter.selectedRace?.description || ''}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Class Archetype</FormLabel>
                                                        <Input
                                                            name="selectedClass.archetype"
                                                            value={editableCharacter.selectedClass?.archetype || ''}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>
                                                </SimpleGrid>

                                                <Divider borderColor="gray.700" />

                                                <Heading size="sm" color="gray.300">Base Stats</Heading>

                                                {editableCharacter.baseStats && (
                                                    <SimpleGrid columns={2} spacing={4}>
                                                        {Object.entries(editableCharacter.baseStats).map(([stat, value]) => (
                                                            <FormControl key={stat}>
                                                                <FormLabel color="gray.300">
                                                                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                                                </FormLabel>
                                                                <Input
                                                                    type="number"
                                                                    value={value}
                                                                    onChange={(e) => handleStatChange(
                                                                        stat as keyof typeof DEFAULT_BASE_STATS,
                                                                        parseInt(e.target.value) || 0
                                                                    )}
                                                                    bg="gray.750"
                                                                    borderColor="gray.600"
                                                                />
                                                            </FormControl>
                                                        ))}
                                                    </SimpleGrid>
                                                )}

                                                <Divider borderColor="gray.700" />

                                                <Heading size="sm" color="gray.300">Vitals</Heading>

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <FormControl>
                                                        <FormLabel color="gray.300">Current HP</FormLabel>
                                                        <Input
                                                            name="currentHp"
                                                            type="number"
                                                            value={editableCharacter.currentHp || 10}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Max HP</FormLabel>
                                                        <Input
                                                            name="maxHp"
                                                            type="number"
                                                            value={editableCharacter.maxHp || 10}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Current MP</FormLabel>
                                                        <Input
                                                            name="currentMp"
                                                            type="number"
                                                            value={editableCharacter.currentMp || 5}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Max MP</FormLabel>
                                                        <Input
                                                            name="maxMp"
                                                            type="number"
                                                            value={editableCharacter.maxMp || 5}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Current AP</FormLabel>
                                                        <Input
                                                            name="currentAp"
                                                            type="number"
                                                            value={editableCharacter.currentAp || 2}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel color="gray.300">Max AP</FormLabel>
                                                        <Input
                                                            name="maxAp"
                                                            type="number"
                                                            value={editableCharacter.maxAp || 2}
                                                            onChange={handleInputChange}
                                                            bg="gray.750"
                                                            borderColor="gray.600"
                                                        />
                                                    </FormControl>
                                                </SimpleGrid>
                                            </VStack>
                                        ) : selectedCharacter ? (
                                            <VStack spacing={4} align="stretch">
                                                <Box>
                                                    <Text color="gray.400" fontSize="sm">Character Name</Text>
                                                    <Text color="gray.200" fontWeight="bold">{selectedCharacter.characterName}</Text>
                                                </Box>

                                                <HStack>
                                                    <Box>
                                                        <Text color="gray.400" fontSize="sm">Level</Text>
                                                        <Text color="gray.200">{selectedCharacter.characterLevel}</Text>
                                                    </Box>

                                                    <Box>
                                                        <Text color="gray.400" fontSize="sm">Gold</Text>
                                                        <HStack>
                                                            <Coins size={14} className="text-amber-400" />
                                                            <Text color="amber.300">{selectedCharacter.gold !== undefined ? selectedCharacter.gold : 0}</Text>
                                                        </HStack>
                                                    </Box>
                                                </HStack>

                                                <Divider borderColor="gray.700" />

                                                <Box>
                                                    <Text color="gray.400" fontSize="sm">Race</Text>
                                                    <Text color="gray.200">
                                                        {selectedCharacter.selectedRace?.name || 'None selected'}
                                                    </Text>
                                                    {selectedCharacter.selectedRace?.description && (
                                                        <Text color="gray.400" fontSize="xs" mt={1}>
                                                            {selectedCharacter.selectedRace.description}
                                                        </Text>
                                                    )}
                                                </Box>

                                                <Box>
                                                    <Text color="gray.400" fontSize="sm">Class</Text>
                                                    <Text color="gray.200">
                                                        {selectedCharacter.selectedClass?.name || 'None selected'}
                                                    </Text>
                                                    {selectedCharacter.selectedClass?.archetype && (
                                                        <Badge colorScheme="purple" mt={1}>
                                                            {selectedCharacter.selectedClass.archetype}
                                                        </Badge>
                                                    )}
                                                </Box>

                                                <Divider borderColor="gray.700" />

                                                <Heading size="sm" color="gray.300">Base Stats</Heading>

                                                {selectedCharacter.baseStats && (
                                                    <SimpleGrid columns={2} spacing={4}>
                                                        {Object.entries(selectedCharacter.baseStats).map(([stat, value]) => (
                                                            <Box key={stat}>
                                                                <Text color="gray.400" fontSize="sm">
                                                                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                                                </Text>
                                                                <Text color="gray.200">{value}</Text>
                                                            </Box>
                                                        ))}
                                                    </SimpleGrid>
                                                )}

                                                <Divider borderColor="gray.700" />

                                                <Heading size="sm" color="gray.300">Vitals</Heading>

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <Box>
                                                        <Text color="gray.400" fontSize="sm">HP</Text>
                                                        <Text color="accent.300">
                                                            {selectedCharacter.currentHp || 0} / {selectedCharacter.maxHp || 0}
                                                        </Text>
                                                    </Box>

                                                    <Box>
                                                        <Text color="gray.400" fontSize="sm">MP</Text>
                                                        <Text color="brand.300">
                                                            {selectedCharacter.currentMp || 0} / {selectedCharacter.maxMp || 0}
                                                        </Text>
                                                    </Box>

                                                    <Box>
                                                        <Text color="gray.400" fontSize="sm">AP</Text>
                                                        <Text color="purple.300">
                                                            {selectedCharacter.currentAp || 0} / {selectedCharacter.maxAp || 0}
                                                        </Text>
                                                    </Box>
                                                </SimpleGrid>

                                                <Divider borderColor="gray.700" />

                                                <Box>
                                                    <Text color="gray.400" fontSize="sm">Created</Text>
                                                    <Text color="gray.200">{formatDate(selectedCharacter.createdAt)}</Text>
                                                </Box>

                                                <Box>
                                                    <Text color="gray.400" fontSize="sm">Last Updated</Text>
                                                    <Text color="gray.200">{formatDate(selectedCharacter.lastUpdated)}</Text>
                                                </Box>
                                            </VStack>
                                        ) : null}
                                    </ScrollArea>
                                </VStack>
                            </Box>
                        )}
                    </Flex>
                )}

                {/* Delete Character Confirmation Dialog */}
                <AlertDialog
                    isOpen={isDeleting}
                    leastDestructiveRef={cancelRef}
                    onClose={() => setIsDeleting(false)}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent bg="gray.800" borderColor="gray.700">
                            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.100">
                                Delete Character
                            </AlertDialogHeader>

                            <AlertDialogBody color="gray.300">
                                Are you sure you want to delete "{selectedCharacter?.characterName}"?
                                This action cannot be undone.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={() => setIsDeleting(false)} colorScheme="gray">
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="accent"
                                    onClick={handleDeleteCharacter}
                                    ml={3}
                                    isLoading={isSaving}
                                >
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </VStack>
        </Box>
    );
};

export default DMCharacterManager;