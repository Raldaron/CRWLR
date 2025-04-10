'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Center,
  Divider, // Added Divider
  AlertDialog, // Added AlertDialog
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  FormControl,
  FormLabel,
  Textarea, // Added Tooltip
  GridItem, // Added GridItem for layout control
  TableContainer, // Added TableContainer
} from '@chakra-ui/react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  Timestamp, // <--- IMPORT Timestamp
  serverTimestamp,
  addDoc, // Added addDoc
  deleteDoc, // Added deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext'; // Assuming context exists
import {
  Search,
  Users,
  ChevronUp,
  ChevronDown,
  Edit,
  BarChart3,
  Boxes,
  Sparkles,
  Award,
  Package,
  Trash, // Added Trash
  PlusCircle, // Added PlusCircle
  Save, // Added Save
  X, // Added X
  AlertTriangle, // Added AlertTriangle
  Coins,
  User as UserIcon, // Renamed import
} from 'lucide-react';
import DMPlayerInventoryModal from './DMPlayerInventoryModal';
import DarkThemedCard from '@/components/ui/DarkThemedCard'; // Assuming this exists
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming this exists

// Player interface (User data)
interface PlayerUser {
  id: string; // User document ID (Auth UID)
  displayName: string;
  email?: string;
}

// Character interface (matches Firestore structure)
interface Character {
  id: string; // Character document ID
  userId: string; // User ID associated with the character
  characterName: string;
  characterLevel: number;
  selectedRace?: { name: string; description?: string } | null; // Added description optional field
  selectedClass?: { name: string; archetype?: string } | null; // Added archetype optional field
  createdAt?: Timestamp; // <--- Keep as Timestamp if possible
  lastUpdated?: Timestamp; // <--- Keep as Timestamp if possible
  currentHp?: number;
  maxHp?: number;
  currentMp?: number;
  maxMp?: number;
  currentAp?: number; // Added AP
  maxAp?: number; // Added AP
  baseStats?: {
    strength: number;
    dexterity: number;
    stamina: number;
    intelligence: number;
    perception: number;
    wit: number;
    charisma: number;
  };
  inventory?: any[];
  gold?: number;
}

// Default values for a new character
const DEFAULT_CHARACTER_STATS = {
    strength: 1, dexterity: 1, stamina: 1,
    intelligence: 1, perception: 1, wit: 1, charisma: 1
};

const DEFAULT_NEW_CHARACTER: Omit<Character, 'id' | 'userId' | 'createdAt' | 'lastUpdated'> = {
    characterName: 'New Character',
    characterLevel: 1,
    selectedRace: null,
    selectedClass: null,
    currentHp: 10,
    maxHp: 10,
    currentMp: 5,
    maxMp: 5,
    currentAp: 2,
    maxAp: 2,
    baseStats: { ...DEFAULT_CHARACTER_STATS },
    inventory: [],
    gold: 0,
};


const DMPlayerManager: React.FC = () => {
  const { currentUser } = useAuth(); // Get current user
  const [players, setPlayers] = useState<PlayerUser[]>([]); // Holds user data
  const [characters, setCharacters] = useState<Character[]>([]); // Holds all character data
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // Track new character creation
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerUser, setSelectedPlayerUser] = useState<PlayerUser | null>(null); // Selected User
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null); // Selected Character for details/edit
  const [editableCharacter, setEditableCharacter] = useState<Partial<Character> | null>(null); // For editing form
  const [isEditing, setIsEditing] = useState(false); // Track edit mode for details panel
  const [isSaving, setIsSaving] = useState(false); // Track saving state

  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null!); // Ref for AlertDialog

  // Modal controls
  const { isOpen: isLevelOpen, onOpen: onLevelOpen, onClose: onLevelClose } = useDisclosure();
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
  const { isOpen: isInventoryOpen, onOpen: onInventoryOpen, onClose: onInventoryClose } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure(); // Delete confirmation

  // State for level management modal
  const [newLevel, setNewLevel] = useState<number>(1);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null); // Track character to delete

  // Combined loading state
  const isLoading = isLoadingPlayers || isLoadingCharacters;

  // --- Helper Function to Get Time Value ---
  const getTimeValue = (timestampValue: any): number => {
      if (timestampValue instanceof Timestamp) { // Check if it's a Firestore Timestamp
          return timestampValue.toMillis();
      } else if (timestampValue instanceof Date) { // Check if it's a JS Date
           return timestampValue.getTime();
      } else if (typeof timestampValue === 'number') { // Check if it's already milliseconds
          return timestampValue;
      }
      return 0; // Default for null, undefined, or other types
  };

  // Fetch players (Users)
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoadingPlayers(true);
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const playerList: PlayerUser[] = usersSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          displayName: docSnapshot.data().displayName || docSnapshot.data().email || 'Unknown Player',
          email: docSnapshot.data().email || 'No Email',
        })).sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort players by name
        setPlayers(playerList);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast({ title: 'Error', description: 'Failed to load player users', status: 'error' });
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    fetchPlayers();
  }, [toast]);

  // Fetch all characters
  useEffect(() => {
    const fetchCharacters = async () => {
      setIsLoadingCharacters(true);
      try {
        const charactersRef = collection(db, 'characters');
        const charactersSnapshot = await getDocs(charactersRef);
        const charList: Character[] = charactersSnapshot.docs.map((docSnapshot) => {
             const data = docSnapshot.data();
             // Ensure timestamps are handled correctly (Firestore SDK should return Timestamps)
             return {
                id: docSnapshot.id,
                userId: data.userId || '',
                characterName: data.characterName || 'Unnamed Character',
                characterLevel: data.characterLevel || 1,
                selectedRace: data.selectedRace || null,
                selectedClass: data.selectedClass || null,
                createdAt: data.createdAt, // Keep as Firestore Timestamp
                lastUpdated: data.lastUpdated, // Keep as Firestore Timestamp
                currentHp: data.currentHp ?? 10,
                maxHp: data.maxHp ?? 10,
                currentMp: data.currentMp ?? 5,
                maxMp: data.maxMp ?? 5,
                currentAp: data.currentAp ?? 2,
                maxAp: data.maxAp ?? 2,
                baseStats: data.baseStats || { ...DEFAULT_CHARACTER_STATS },
                inventory: data.inventory || [],
                gold: data.gold || 0,
            } as Character; // Assert type
        });
        setCharacters(charList);
      } catch (error) {
        console.error('Error fetching characters:', error);
        toast({ title: 'Error', description: 'Failed to load character data', status: 'error' });
      } finally {
        setIsLoadingCharacters(false);
      }
    };
    fetchCharacters();
  }, [toast]);


  // Filter players based on search term
   const filteredPlayers = useMemo(() => {
       if (searchTerm.trim() === '') return players;
       const lowerSearchTerm = searchTerm.toLowerCase();
       return players.filter(player =>
           player.displayName.toLowerCase().includes(lowerSearchTerm) ||
           (player.email && player.email.toLowerCase().includes(lowerSearchTerm))
       );
   }, [searchTerm, players]);

  // Get characters for the selected player - USING THE HELPER
  const selectedPlayerCharacters = useMemo(() => {
    if (!selectedPlayerUser) return [];
    return characters
      .filter(char => char.userId === selectedPlayerUser.id)
      .sort((a, b) => {
          const timeB = getTimeValue(b.lastUpdated); // Use helper
          const timeA = getTimeValue(a.lastUpdated); // Use helper
          return timeB - timeA; // Sort descending (newest first)
      });
  }, [selectedPlayerUser, characters]); // Keep characters dependency

  // Format date for display (using the helper)
   const formatDate = (timestampValue?: any) => { // Accept any type
        const millis = getTimeValue(timestampValue); // Get milliseconds safely
        if (millis === 0) return 'Unknown';
        return new Date(millis).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

  // --- Character Actions ---

  const handleCreateCharacter = async () => {
    if (!selectedPlayerUser) {
      toast({ title: 'No Player Selected', description: 'Please select a player first.', status: 'warning' });
      return;
    }
    setIsSaving(true);
    try {
       // Use serverTimestamp for Firestore writes
      const now = serverTimestamp();
      const newCharacterData = { // Construct data without explicit type for serverTimestamp
        ...DEFAULT_NEW_CHARACTER,
        userId: selectedPlayerUser.id,
        characterName: `New Char for ${selectedPlayerUser.displayName}`,
        createdAt: now,
        lastUpdated: now,
      };

      const docRef = await addDoc(collection(db, 'characters'), newCharacterData);
       // Fetch the created doc to get accurate server-generated timestamps for local state
       const createdDocSnap = await getDoc(docRef);
       // Ensure data fetched back includes Timestamps where expected
       const createdCharacter = { id: docRef.id, ...createdDocSnap.data() } as Character;

      // Update local state
      // Ensure the new character has correct Timestamp types before adding
      setCharacters(prev => [createdCharacter, ...prev]);

      toast({ title: 'Character Created', description: `Created ${createdCharacter.characterName}`, status: 'success' });
      setSelectedCharacter(createdCharacter); // Optionally select the new character
      setEditableCharacter({ ...createdCharacter }); // Set for editing
      setIsEditing(true); // Enter edit mode immediately

    } catch (error) {
      console.error('Error creating character:', error);
      toast({ title: 'Error', description: 'Failed to create character', status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

   const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
     setIsSaving(true); // Indicate deletion is in progress

    try {
      await deleteDoc(doc(db, 'characters', characterToDelete.id));

      // Update local state
      setCharacters(prev => prev.filter(char => char.id !== characterToDelete.id));

      toast({ title: 'Character Deleted', description: `${characterToDelete.characterName} has been deleted.`, status: 'success' });

      // Clear selections if the deleted character was selected
      if (selectedCharacter?.id === characterToDelete.id) {
        setSelectedCharacter(null);
        setEditableCharacter(null);
        setIsEditing(false);
      }
      setCharacterToDelete(null); // Clear the character marked for deletion
      onDeleteClose(); // Close the confirmation dialog

    } catch (error) {
      console.error('Error deleting character:', error);
      toast({ title: 'Error', description: 'Failed to delete character', status: 'error' });
    } finally {
       setIsSaving(false); // Finish deletion process
    }
  };

  // Open delete confirmation
  const openDeleteConfirmation = (character: Character) => {
    setCharacterToDelete(character);
    onDeleteOpen();
  };

  // Handle selecting a player user
  const handleSelectPlayerUser = (user: PlayerUser) => {
    setSelectedPlayerUser(user);
    setSelectedCharacter(null); // Deselect character when changing player
    setEditableCharacter(null);
    setIsEditing(false);
  };

  // Handle selecting a character from the list
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setEditableCharacter({ ...character }); // Load into editable state for viewing/editing
    setIsEditing(false); // Start in view mode
  };

  // Enter edit mode for the selected character
  const handleEditCharacter = () => {
    if (!selectedCharacter) return;
    setEditableCharacter({ ...selectedCharacter }); // Ensure editable has full data
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (selectedCharacter) {
        setEditableCharacter({ ...selectedCharacter }); // Revert to original selected data
    } else {
        setEditableCharacter(null); // Clear if no character was selected
    }
    setIsEditing(false);
    setIsCreating(false); // Also ensure creating flag is reset
  };

  // Handle input changes in the edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editableCharacter) return;
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    // Handle nested properties like baseStats.strength or selectedRace.name
    if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setEditableCharacter(prev => ({
            ...prev,
            [parent]: {
                ...(prev?.[parent as keyof Character] as object | null || {}), // Handle potential null parent
                [child]: type === 'number' ? parseFloat(value) || 0 : value,
            }
        }));
    } else {
        // Handle direct properties
        setEditableCharacter(prev => ({
            ...prev,
            [name]: checked !== undefined ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }));
    }
  };

   // Handle NumberInput changes (like level, HP, MP, gold)
    const handleNumberInputChangeDirect = (name: keyof Character, valueAsString: string, valueAsNumber: number) => {
        if (!editableCharacter) return;
         setEditableCharacter(prev => ({
            ...prev,
            [name]: isNaN(valueAsNumber) ? 0 : valueAsNumber, // Default to 0 if NaN
        }));
    };

   // Handle base stat changes
    const handleStatChange = (stat: keyof typeof DEFAULT_CHARACTER_STATS, valueAsString: string, valueAsNumber: number) => {
        if (!editableCharacter) return;
        setEditableCharacter(prev => ({
            ...prev,
            baseStats: {
                ...(prev?.baseStats || DEFAULT_CHARACTER_STATS),
                [stat]: isNaN(valueAsNumber) ? 0 : valueAsNumber,
            }
        }));
    };


  // Save edited character data
  const handleSaveCharacter = async () => {
    if (!editableCharacter || (!selectedCharacter && !isCreating)) return; // Adjusted condition
     if (!editableCharacter.characterName?.trim()) {
         toast({ title: 'Name Required', description: 'Character name cannot be empty.', status: 'warning' });
         return;
     }

    setIsSaving(true);
    try {
        const characterIdToSave = editableCharacter.id;
        const isNew = isCreating && !characterIdToSave; // Determine if creating

        // Prepare data, exclude ID if present, add server timestamp
        const { id, createdAt, ...dataToSave } = editableCharacter; // Exclude id and createdAt if updating
        const finalData: any = {
            ...dataToSave,
            userId: editableCharacter.userId || selectedPlayerUser?.id, // Ensure userId is set
            lastUpdated: serverTimestamp(), // Use server timestamp
        };

        // Add createdAt only if it's a new character
        if (isNew) {
            finalData.createdAt = serverTimestamp();
        }

        if (isNew) {
             // Add new document
             const docRef = await addDoc(collection(db, 'characters'), finalData);
             const newId = docRef.id;
             // Fetch the created doc to get accurate timestamps for local state
             const createdDocSnap = await getDoc(docRef);
             const createdCharacter = { id: newId, ...createdDocSnap.data() } as Character;

             // Update local state
             setCharacters(prev => [createdCharacter, ...prev]);
             setSelectedCharacter(createdCharacter);
             toast({ title: 'Character Created', description: `${createdCharacter.characterName} created.`, status: 'success' });

        } else if(characterIdToSave) {
             // Update existing document
             const characterRef = doc(db, 'characters', characterIdToSave);
             await updateDoc(characterRef, finalData);

             // Fetch updated doc to get accurate timestamp for local state
             const updatedDocSnap = await getDoc(characterRef);
             const updatedCharacter = { id: characterIdToSave, ...updatedDocSnap.data() } as Character;

             // Update local state
             setCharacters(prev => prev.map(char => char.id === characterIdToSave ? updatedCharacter : char));
             setSelectedCharacter(updatedCharacter); // Update the selected character view
             toast({ title: 'Character Updated', description: `${updatedCharacter.characterName} saved.`, status: 'success' });
        } else {
             throw new Error("Character ID is missing for update.");
        }

        setIsEditing(false); // Exit edit mode
        setIsCreating(false); // Exit create mode

    } catch (error) {
        console.error('Error saving character:', error);
        toast({ title: 'Error', description: `Failed to save character: ${error instanceof Error ? error.message : 'Unknown error'}`, status: 'error' });
    } finally {
        setIsSaving(false);
    }
  };


  // Handle level change (modal)
  const handleLevelModalChange = async () => {
    if (!selectedCharacter) return;
    setIsSaving(true); // Use saving state for modal action
    try {
      const characterRef = doc(db, 'characters', selectedCharacter.id);
      await updateDoc(characterRef, { characterLevel: newLevel, lastUpdated: serverTimestamp() }); // Use serverTimestamp for accuracy

       // Fetch updated doc to get accurate timestamp for local state
       const updatedDocSnap = await getDoc(characterRef);
       const updatedCharacter = { id: selectedCharacter.id, ...updatedDocSnap.data() } as Character;

       // Update both the main characters list and the specific selected character
       setCharacters(prevChars => prevChars.map(p => p.id === selectedCharacter.id ? updatedCharacter : p));
       setSelectedCharacter(updatedCharacter);
       // Also update the editable state if it matches
       if (editableCharacter?.id === selectedCharacter.id) {
           setEditableCharacter(updatedCharacter);
       }


      toast({ title: 'Level Updated', status: 'success' });
      onLevelClose();
    } catch (error) {
      console.error('Error updating level:', error);
      toast({ title: 'Error', description: 'Failed to update level', status: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  // Open level modal
  const openLevelModal = (character: Character) => {
    setSelectedCharacter(character); // Use selectedCharacter state
    setNewLevel(character.characterLevel);
    onLevelOpen();
  };

  // Open stats modal
  const openStatsModal = (character: Character) => {
    setSelectedCharacter(character); // Use selectedCharacter state
    onStatsOpen();
  };

  // Open Inventory Modal
  const openInventoryModal = (character: Character) => {
    setSelectedCharacter(character); // Use selectedCharacter state
    onInventoryOpen();
  };

  // --- Render Functions ---

  const renderPlayerList = () => (
       <Box bg="gray.800" p={4} borderRadius="md" h="full" display="flex" flexDirection="column">
            <Heading size="md" color="gray.200" mb={4}>Players</Heading>
            <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none"><Search className="h-4 w-4 text-gray-400" /></InputLeftElement>
                <Input placeholder="Search players..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="gray.750" borderColor="gray.600" size="sm"/>
            </InputGroup>
            <Box flex={1} overflowY="auto"> {/* Make list scrollable */}
                <ScrollArea className="h-full pr-2"> {/* Use full height of parent */}
                    <VStack spacing={2} align="stretch">
                        {filteredPlayers.length === 0 ? <Text color="gray.400" textAlign="center" py={4}>No players found</Text> :
                        filteredPlayers.map(user => {
                            const charCount = characters.filter(c => c.userId === user.id).length;
                            return (
                                <DarkThemedCard
                                    key={user.id}
                                    onClick={() => handleSelectPlayerUser(user)}
                                    isSelected={selectedPlayerUser?.id === user.id}
                                    borderColor={selectedPlayerUser?.id === user.id ? "brand.600" : "gray.700"}
                                    p={3} height="auto" // Adjusted padding
                                >
                                    <VStack align="start" spacing={1}>
                                        <HStack><UserIcon size={16} className="text-brand-400" /><Text fontWeight="medium" color="gray.200" fontSize="sm">{user.displayName}</Text></HStack>
                                        <Text fontSize="xs" color="gray.400">{user.email}</Text>
                                        <Badge colorScheme="purple" variant="outline" fontSize="xs">{charCount} character(s)</Badge>
                                    </VStack>
                                </DarkThemedCard>
                            );
                        })}
                    </VStack>
                </ScrollArea>
            </Box>
        </Box>
  );

   const renderCharacterList = () => (
       <Box bg="gray.800" p={4} borderRadius="md" h="full" display="flex" flexDirection="column">
           <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}> {/* Allow wrap */}
               <Heading size="md" color="gray.200">
                   {selectedPlayerUser ? `${selectedPlayerUser.displayName}'s Characters` : 'Select Player'} {/* Updated text */}
               </Heading>
                {selectedPlayerUser && (
                    <Button size="sm" colorScheme="brand" leftIcon={<PlusCircle size={16} />} onClick={handleCreateCharacter} isDisabled={isSaving || isEditing || isCreating} isLoading={isSaving}> {/* Disable during save/edit/create */}
                        New Char
                    </Button>
                )}
           </Flex>
            {selectedPlayerUser ? (
                <Box flex={1} overflowY="auto"> {/* Make list scrollable */}
                   {selectedPlayerCharacters.length === 0 ? (
                       <Flex direction="column" align="center" justify="center" h="200px" border="1px dashed" borderColor="gray.600" borderRadius="md" p={6}>
                           <Text color="gray.400" mb={4}>No characters yet</Text>
                           <Button colorScheme="brand" leftIcon={<PlusCircle size={16} />} onClick={handleCreateCharacter} isDisabled={isSaving} size="sm">Create First</Button>
                       </Flex>
                   ) : (
                        <ScrollArea className="h-full pr-2"> {/* Use full height */}
                           <VStack spacing={2} align="stretch"> {/* Use VStack for single column */}
                               {selectedPlayerCharacters.map(character => (
                                   <DarkThemedCard
                                       key={character.id}
                                       onClick={() => handleSelectCharacter(character)}
                                       isSelected={selectedCharacter?.id === character.id}
                                       borderColor={selectedCharacter?.id === character.id ? "accent.600" : "gray.700"}
                                       p={3} height="auto" // Adjusted padding
                                   >
                                       <VStack align="start" spacing={1}>
                                           <Flex justify="space-between" width="100%">
                                               <Text fontWeight="bold" color="gray.200" fontSize="sm">{character.characterName}</Text>
                                               <Badge colorScheme="teal" fontSize="xs">Lvl {character.characterLevel}</Badge>
                                           </Flex>
                                           <HStack spacing={1} wrap="wrap">
                                               {character.selectedRace && <Badge colorScheme="green" fontSize="xs">{character.selectedRace.name}</Badge>}
                                               {character.selectedClass && <Badge colorScheme="purple" fontSize="xs">{character.selectedClass.name}</Badge>}
                                           </HStack>
                                           <HStack spacing={1}>
                                                <Coins size={12} className="text-amber-400" />
                                                <Text fontSize="xs" color="amber.300">{character.gold ?? 0} GP</Text>
                                           </HStack>
                                            <Text fontSize="xs" color="gray.500">Updated: {formatDate(character.lastUpdated)}</Text>
                                       </VStack>
                                   </DarkThemedCard>
                               ))}
                           </VStack>
                       </ScrollArea>
                   )}
               </Box>
           ) : (
               <Flex direction="column" align="center" justify="center" h="200px"><Text color="gray.400">Select a player</Text></Flex>
           )}
       </Box>
   );

   const renderCharacterDetails = () => (
        <Box bg="gray.800" p={4} borderRadius="md" h="full" display="flex" flexDirection="column">
           <Flex justify="space-between" align="center" mb={4}>
               <Heading size="md" color="gray.200">
                   {isCreating ? 'Create New Character' : isEditing ? 'Edit Character' : 'Character Details'}
               </Heading>
                {/* Action Buttons */}
                {!isEditing && !isCreating && selectedCharacter && ( // Show only in view mode for a selected character
                    <HStack>
                        <Tooltip label="Edit Character"><IconButton aria-label="Edit" icon={<Edit size={16} />} size="sm" colorScheme="brand" variant="outline" onClick={handleEditCharacter} /></Tooltip>
                        <Tooltip label="Delete Character"><IconButton aria-label="Delete" icon={<Trash size={16} />} size="sm" colorScheme="red" variant="outline" onClick={() => openDeleteConfirmation(selectedCharacter)} isLoading={isSaving}/></Tooltip>
                    </HStack>
                )}
                {(isEditing || isCreating) && ( // Show Save/Cancel in edit or create mode
                    <HStack>
                        <Button size="sm" colorScheme="brand" leftIcon={<Save size={16} />} onClick={handleSaveCharacter} isLoading={isSaving}>Save</Button>
                        <Button size="sm" variant="ghost" colorScheme="gray" onClick={handleCancelEdit} leftIcon={<X size={16} />}>Cancel</Button>
                    </HStack>
                )}
           </Flex>

            <Box flex={1} overflowY="auto"> {/* Make content scrollable */}
                {editableCharacter ? (
                    <ScrollArea className="h-full pr-2"> {/* Use full height */}
                    {(isEditing || isCreating) ? ( // Combine edit and create forms
                        /* --- EDITING/CREATING FORM --- */
                        <VStack spacing={3} align="stretch">
                            <FormControl isRequired size="sm"><FormLabel fontSize="xs" color="gray.400">Name</FormLabel><Input size="sm" name="characterName" value={editableCharacter.characterName || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600"/></FormControl>
                            <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Level</FormLabel><NumberInput size="sm" name="characterLevel" value={editableCharacter.characterLevel || 1} onChange={(valStr, valNum) => handleNumberInputChangeDirect('characterLevel', valStr, valNum)} min={1} bg="gray.700" borderColor="gray.600"><NumberInputField /><NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper></NumberInput></FormControl>
                            <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Gold</FormLabel><NumberInput size="sm" name="gold" value={editableCharacter.gold || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('gold', valStr, valNum)} min={0} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>

                            <Divider borderColor="gray.600" my={2}/>
                            <Heading size="xs" color="gray.300">Race & Class</Heading>
                            <SimpleGrid columns={2} spacing={2}>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Race</FormLabel><Input size="sm" name="selectedRace.name" value={editableCharacter.selectedRace?.name || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600" placeholder="e.g., Human"/></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Class</FormLabel><Input size="sm" name="selectedClass.name" value={editableCharacter.selectedClass?.name || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600" placeholder="e.g., Warrior"/></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Race Desc.</FormLabel><Textarea size="sm" name="selectedRace.description" value={editableCharacter.selectedRace?.description || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600" rows={1} placeholder="Optional flavor"/></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Archetype</FormLabel><Input size="sm" name="selectedClass.archetype" value={editableCharacter.selectedClass?.archetype || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600" placeholder="Optional flavor"/></FormControl>
                            </SimpleGrid>

                            <Divider borderColor="gray.600" my={2}/>
                            <Heading size="xs" color="gray.300">Vitals</Heading>
                                <SimpleGrid columns={2} spacing={2}>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Current HP</FormLabel><NumberInput size="sm" name="currentHp" value={editableCharacter.currentHp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('currentHp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Max HP</FormLabel><NumberInput size="sm" name="maxHp" value={editableCharacter.maxHp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('maxHp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Current MP</FormLabel><NumberInput size="sm" name="currentMp" value={editableCharacter.currentMp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('currentMp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Max MP</FormLabel><NumberInput size="sm" name="maxMp" value={editableCharacter.maxMp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('maxMp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Current AP</FormLabel><NumberInput size="sm" name="currentAp" value={editableCharacter.currentAp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('currentAp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                                <FormControl size="sm"><FormLabel fontSize="xs" color="gray.400">Max AP</FormLabel><NumberInput size="sm" name="maxAp" value={editableCharacter.maxAp || 0} onChange={(valStr, valNum) => handleNumberInputChangeDirect('maxAp', valStr, valNum)} bg="gray.700" borderColor="gray.600"><NumberInputField /></NumberInput></FormControl>
                            </SimpleGrid>

                            <Divider borderColor="gray.600" my={2}/>
                            <Heading size="xs" color="gray.300">Base Stats</Heading>
                            <SimpleGrid columns={{base: 2, md: 3}} spacing={2}> {/* Responsive columns for stats */}
                                {Object.entries(editableCharacter.baseStats || DEFAULT_CHARACTER_STATS).map(([stat, value]) => (
                                    <FormControl key={stat} size="sm">
                                        <FormLabel fontSize="xs" color="gray.400" textTransform="capitalize">{stat}</FormLabel>
                                        <NumberInput size="sm" value={value} onChange={(valStr, valNum) => handleStatChange(stat as keyof typeof DEFAULT_CHARACTER_STATS, valStr, valNum)} bg="gray.700" borderColor="gray.600">
                                            <NumberInputField />
                                        </NumberInput>
                                    </FormControl>
                                ))}
                            </SimpleGrid>
                        </VStack>
                    ) : (
                        /* --- VIEWING DETAILS --- */
                        <VStack spacing={3} align="stretch">
                                <Box><Text fontSize="sm" color="gray.400">Name</Text><Text fontWeight="bold">{editableCharacter.characterName}</Text></Box>
                                <HStack justify="space-between">
                                    <Box><Text fontSize="sm" color="gray.400">Level</Text><Badge colorScheme="teal">{editableCharacter.characterLevel}</Badge></Box>
                                    <Box><Text fontSize="sm" color="gray.400">Gold</Text><HStack spacing={1}><Coins size={14} className="text-amber-400" /><Text color="amber.300">{editableCharacter.gold ?? 0}</Text></HStack></Box>
                                </HStack>
                                <Divider borderColor="gray.600" my={2}/>
                                <Box><Text fontSize="sm" color="gray.400">Race</Text><Text>{editableCharacter.selectedRace?.name || 'N/A'}</Text></Box>
                                <Box><Text fontSize="sm" color="gray.400">Class</Text><Text>{editableCharacter.selectedClass?.name || 'N/A'}{editableCharacter.selectedClass?.archetype && <Badge ml={2} colorScheme="purple" fontSize="xs">{editableCharacter.selectedClass.archetype}</Badge>}</Text></Box>
                                <Divider borderColor="gray.600" my={2}/>
                                <Heading size="xs" color="gray.300">Vitals</Heading>
                                <SimpleGrid columns={{base: 2, md: 3}} spacing={2}> {/* Responsive vitals */}
                                    <Box textAlign="center" bg="gray.750" p={2} borderRadius="md"><Text fontSize="xs" color="gray.400">HP</Text><Text color="red.300">{editableCharacter.currentHp ?? 0} / {editableCharacter.maxHp ?? 0}</Text></Box>
                                    <Box textAlign="center" bg="gray.750" p={2} borderRadius="md"><Text fontSize="xs" color="gray.400">MP</Text><Text color="blue.300">{editableCharacter.currentMp ?? 0} / {editableCharacter.maxMp ?? 0}</Text></Box>
                                    <Box textAlign="center" bg="gray.750" p={2} borderRadius="md"><Text fontSize="xs" color="gray.400">AP</Text><Text color="purple.300">{editableCharacter.currentAp ?? 0} / {editableCharacter.maxAp ?? 0}</Text></Box>
                                </SimpleGrid>
                                <Divider borderColor="gray.600" my={2}/>
                                <Heading size="xs" color="gray.300">Base Stats</Heading>
                                <SimpleGrid columns={{base: 3, md: 4}} spacing={2}> {/* Responsive stats */}
                                {Object.entries(editableCharacter.baseStats || {}).map(([stat, value]) => (
                                    <Box key={stat} textAlign="center">
                                        <Text fontSize="xs" color="gray.400" textTransform="capitalize">{stat}</Text>
                                        <Text fontWeight="medium">{value}</Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                            <Divider borderColor="gray.600" my={2}/>
                                {/* Quick Action Buttons - Only show if a character is selected */}
                                {selectedCharacter && (
                                     <VStack spacing={2} align="stretch">
                                        <Heading size="xs" color="gray.300">Quick Actions</Heading>
                                        <Button size="xs" leftIcon={<Award size={14}/>} onClick={() => openLevelModal(selectedCharacter)} variant="outline" colorScheme="teal">Manage Level</Button>
                                        <Button size="xs" leftIcon={<Package size={14}/>} onClick={() => openInventoryModal(selectedCharacter)} variant="outline" colorScheme="green">Manage Inventory</Button>
                                        <Button size="xs" leftIcon={<BarChart3 size={14}/>} onClick={() => openStatsModal(selectedCharacter)} variant="outline" colorScheme="yellow">View Stats Detail</Button>
                                    </VStack>
                                )}
                        </VStack>
                    )}
                </ScrollArea>
                ) : ( // Show placeholder if no character is selected and not creating
                    <Flex direction="column" align="center" justify="center" h="full">
                         <Text color="gray.400">Select a character to view or edit details,</Text>
                         <Text color="gray.400">or create a new character for the selected player.</Text>
                     </Flex>
                )}
            </Box>
        </Box>
   );


  return (
    <Box p={{base: 2, md: 4}}> {/* Responsive padding */}
      {isLoading ? (
        <Center h="400px"><Spinner size="xl" color="brand.500" /></Center>
      ) : (
         <Grid
            templateColumns={{ base: "1fr", md: "250px 1fr", xl: "250px 350px 1fr" }} // Responsive columns
            gap={{base: 2, md: 4}} // Responsive gap
            h={{ base: "auto", md: "calc(100vh - 120px)" }} // Full height on desktop, auto on mobile
            minH="70vh" // Minimum height
         >
            {/* Player List */}
             <GridItem colSpan={1} h={{ base: "300px", md: "full" }}> {/* Fixed height on mobile, full on desktop */}
                 {renderPlayerList()}
             </GridItem>

            {/* Character List */}
             <GridItem colSpan={1} h={{ base: "300px", md: "full" }}> {/* Fixed height on mobile, full on desktop */}
                {renderCharacterList()}
             </GridItem>

            {/* Character Details/Edit Panel */}
             <GridItem colSpan={1} h="full" flexDirection="column"> {/* Hide on md and below, ensure flex column */}
                {renderCharacterDetails()}
             </GridItem>
         </Grid>
      )}

      {/* --- Modals --- */}
      {/* Level Management Modal */}
       <Modal isOpen={isLevelOpen} onClose={onLevelClose} size={{base: 'xs', md: 'md'}} isCentered> {/* Responsive size and centered */}
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700" color="gray.200">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Level: {selectedCharacter?.characterName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
             <Text mb={4} color="gray.300">Current: {selectedCharacter?.characterLevel}. Set new level:</Text>
            <Center>
                <NumberInput value={newLevel} onChange={(_, value) => setNewLevel(value || 1)} min={1} max={100} w="120px">
                    <NumberInputField textAlign="center" bg="gray.700" borderColor="gray.600" />
                    <NumberInputStepper><NumberIncrementStepper borderColor="gray.600" /><NumberDecrementStepper borderColor="gray.600" /></NumberInputStepper>
                </NumberInput>
            </Center>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <Button variant="ghost" color="gray.400" mr={3} onClick={onLevelClose}>Cancel</Button>
            <Button colorScheme="brand" onClick={handleLevelModalChange} isLoading={isSaving}>Save Changes</Button> {/* Use isSaving */}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Stats Modal */}
       <Modal isOpen={isStatsOpen} onClose={onStatsClose} size={{base: 'md', md: 'lg'}} isCentered> {/* Responsive size and centered */}
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700" color="gray.200">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">Stats: {selectedCharacter?.characterName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedCharacter && (
                <VStack spacing={4} align="stretch">
                     <SimpleGrid columns={{base: 2, sm: 3}} spacing={4}> {/* Responsive grid */}
                         <Box bg="gray.750" p={3} borderRadius="md" textAlign="center"><Text fontSize="xs" color="gray.400" mb={1}>HP</Text><Text fontSize="lg" fontWeight="bold" color="red.400">{selectedCharacter.currentHp ?? 0} / {selectedCharacter.maxHp ?? 0}</Text></Box>
                         <Box bg="gray.750" p={3} borderRadius="md" textAlign="center"><Text fontSize="xs" color="gray.400" mb={1}>MP</Text><Text fontSize="lg" fontWeight="bold" color="blue.400">{selectedCharacter.currentMp ?? 0} / {selectedCharacter.maxMp ?? 0}</Text></Box>
                         <Box bg="gray.750" p={3} borderRadius="md" textAlign="center"><Text fontSize="xs" color="gray.400" mb={1}>Level</Text><Text fontSize="lg" fontWeight="bold" color="brand.400">{selectedCharacter.characterLevel}</Text></Box>
                    </SimpleGrid>
                     <Box bg="gray.750" p={4} borderRadius="md"><Text fontSize="sm" color="gray.400" mb={3} fontWeight="medium">Base Stats</Text>
                        <SimpleGrid columns={{base: 3, sm: 4}} spacing={4}> {/* Responsive grid */}
                            {Object.entries(selectedCharacter.baseStats || {}).map(([stat, value]) => (<Box key={stat} textAlign="center"><Text fontSize="xs" color="gray.400" textTransform="capitalize">{stat}</Text><Text fontSize="md" fontWeight="bold" color="gray.200">{value}</Text></Box>))}
                        </SimpleGrid>
                    </Box>
                 </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="gray.700"><Button colorScheme="gray" variant="ghost" onClick={onStatsClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      {/* Inventory Modal - Triggered Separately */}
      {selectedCharacter && isInventoryOpen && ( // Conditionally render only when open
        <DMPlayerInventoryModal
          isOpen={isInventoryOpen}
          onClose={onInventoryClose}
          player={{ id: selectedCharacter.id, characterName: selectedCharacter.characterName }} // Pass necessary player info
        />
      )}

       {/* Delete Confirmation Dialog */}
       <AlertDialog isOpen={isDeleteDialogOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered> {/* Centered */}
           <AlertDialogOverlay><AlertDialogContent bg="gray.800" borderColor="gray.700">
               <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.100"><HStack><AlertTriangle className="text-red-400"/><span>Delete Character</span></HStack></AlertDialogHeader>
               <AlertDialogBody color="gray.300">Are you sure you want to delete "{characterToDelete?.characterName}"? This action cannot be undone.</AlertDialogBody>
               <AlertDialogFooter borderTopWidth="1px" borderColor="gray.700">
                   <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost" color="gray.400">Cancel</Button>
                   <Button colorScheme="red" onClick={handleDeleteCharacter} ml={3} isLoading={isSaving}>Delete</Button>
               </AlertDialogFooter>
           </AlertDialogContent></AlertDialogOverlay>
       </AlertDialog>

    </Box>
  );
};

export default DMPlayerManager;