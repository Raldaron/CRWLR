// src/components/dm/DMQuestManager.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Textarea,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    Spinner,
    Alert,
    AlertIcon,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    useToast,
    IconButton,
    Center,
    Divider,
    Checkbox,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    InputGroup,
    InputLeftElement,
    Tooltip,
    Heading,
    Icon, // Added Icon
    TableContainer, // Added TableContainer
    Flex, // Added Flex
    Spacer, // Added Spacer
} from '@chakra-ui/react';
import {
    Plus,
    Search,
    Package,
    Send,
    Users,
    BookOpen,
    Trash,
    Edit,
    Save,
    Gift,
    Award,
    DollarSign,
    ShoppingCart,
    Link as LinkIcon,
    MapPin,
    Users as UsersIcon,
    HelpCircle, // Added HelpCircle
    Coins, // Added Coins
    X, // Added X for close
    AlertTriangle, // For delete confirmation
} from 'lucide-react';
// --- FIX: Added documentId import ---
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp, serverTimestamp, orderBy, documentId } from 'firebase/firestore'; // Added Timestamp, orderBy, serverTimestamp, documentId
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import debounce from 'lodash/debounce';
import ItemSelect from '../loot/ItemSelect'; // Assuming this component is responsive
import type { InventoryItem } from '@/types/inventory';

/* -------------------------------------------------
   Interfaces
------------------------------------------------- */
// Interface for items used specifically as rewards (includes quantity)
interface RewardItem extends InventoryItem {
    quantity: number;
}

interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
    type: 'fetch' | 'kill' | 'escort' | 'explore' | 'talk' | 'use' | 'other';
    target?: string; // e.g., "Goblin Chief", "item_id_123", "Whispering Cave Entrance"
    targetCount?: number; // e.g., 5, 1
    currentCount?: number; // Progress tracking, managed in assignments mainly
    isOptional?: boolean;
}

// Updated QuestReward interface
interface QuestReward {
    experience?: number;
    gold?: number;
    items?: RewardItem[]; // Use RewardItem here
    reputation?: { faction: string; amount: number }[];
    other?: string; // New field for custom/text-based rewards
}

interface QuestPrerequisite {
    type: 'level' | 'quest' | 'item' | 'reputation';
    value: string | number; // Quest ID, Item ID, Faction ID, or Level number
    description?: string; // Optional description for clarity
}

interface Quest {
    id?: string;
    title: string;
    description: string;
    status: 'available' | 'active' | 'completed' | 'failed';
    objectives: QuestObjective[];
    rewards: QuestReward;
    giver?: string; // NPC ID or name
    location?: string; // Area name or ID
    requiredLevel?: number;
    prerequisites?: QuestPrerequisite[];
    relatedQuests?: string[]; // IDs of quests linked to this one
    createdBy: string; // User ID of the creator (DM)
    createdAt: Timestamp; // Firestore Timestamp
    updatedAt?: Timestamp; // Firestore Timestamp
}

interface PlayerCharacter {
    id: string; // Character ID
    characterName: string;
    userId: string; // User ID associated with character
    displayName: string; // User display name
    level?: number;
}

interface QuestAssignment {
    questId: string;
    characterId: string;
    assignedAt: Timestamp; // Firestore Timestamp
    status: 'active' | 'completed' | 'failed';
    objectiveProgress?: { [objectiveId: string]: number }; // Tracks progress like kills/items collected
}


/* -------------------------------------------------
   Utility Functions
------------------------------------------------- */
const getStatusColorScheme = (status: Quest['status']): string => {
    switch (status) {
        case 'available': return 'blue';
        case 'active': return 'yellow';
        case 'completed': return 'green';
        case 'failed': return 'red';
        default: return 'gray';
    }
};

const getObjectiveTypeIcon = (type: QuestObjective['type']) => {
    switch (type) {
        case 'fetch': return <ShoppingCart size={14} />;
        case 'kill': return <Award size={14} />;
        case 'escort': return <UsersIcon size={14} />;
        case 'explore': return <MapPin size={14} />;
        case 'talk': return <UsersIcon size={14} />;
        case 'use': return <Package size={14} />;
        default: return <BookOpen size={14} />;
    }
};

// Helper to check if objective type needs a target count
const objectiveTypeNeedsCount = (type?: string): boolean => ['fetch', 'kill'].includes(type || '');
// Helper to check if objective type needs a target name/description
const objectiveTypeNeedsTarget = (type?: string): boolean => ['fetch', 'kill', 'escort', 'talk', 'use'].includes(type || '');


/* -------------------------------------------------
   Main DMQuestManager Component
------------------------------------------------- */
const DMQuestManager: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

    // Modal States
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
    const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    // Data States
    const [quests, setQuests] = useState<Quest[]>([]);
    const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
    // const [questAssignments, setQuestAssignments] = useState<QuestAssignment[]>([]); // Assignment state if needed later

    // UI States
    const [isLoadingQuests, setIsLoadingQuests] = useState(true);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
    // const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
    const [selectedCharactersForAssign, setSelectedCharactersForAssign] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form States
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuest, setCurrentQuest] = useState<Partial<Quest>>({
        title: '',
        description: '',
        status: 'available',
        objectives: [],
        rewards: { items: [] }, // Initialize rewards.items
        giver: '',
        location: '',
        requiredLevel: 1,
        prerequisites: [],
        relatedQuests: [],
    });

    const cancelRef = useRef<HTMLButtonElement>(null!);

    // --- Data Fetching ---
    const loadQuests = useCallback(async () => {
        if (!currentUser) { setIsLoadingQuests(false); setQuests([]); return; }
        setIsLoadingQuests(true);
        try {
            const questsCollection = collection(db, 'quests');
            const q = query(
                questsCollection,
                where("createdBy", "==", currentUser.uid), // Filter by current DM
                orderBy("createdAt", "desc")
            );
            const questsSnapshot = await getDocs(q);
            const questsList = questsSnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                objectives: docSnap.data().objectives || [],
                rewards: { ...(docSnap.data().rewards || {}), items: docSnap.data().rewards?.items || [] },
            } as Quest));
            setQuests(questsList);
        } catch (error) {
            console.error('Error loading quests:', error);
            toast({ title: 'Error', description: 'Failed to load quests', status: 'error' });
        } finally {
            setIsLoadingQuests(false);
        }
    }, [currentUser, toast]);

    const loadCharacters = useCallback(async () => {
        // Fetch all characters for assignment purposes
        setIsLoadingCharacters(true);
        try {
            const charactersSnapshot = await getDocs(collection(db, 'characters'));
            const characterList: PlayerCharacter[] = [];

            // Fetch user data to add displayName
            const userIds = new Set(charactersSnapshot.docs.map(d => d.data().userId).filter(Boolean));
            const usersData: Record<string, { displayName?: string; email?: string }> = {};
            if (userIds.size > 0) {
                 // Fetch users in chunks if necessary, but for simplicity, fetching all matched users here
                 // --- FIX: Correctly import and use documentId ---
                const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', Array.from(userIds)));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(userDoc => {
                    usersData[userDoc.id] = userDoc.data() as { displayName?: string; email?: string };
                });
            }

            charactersSnapshot.docs.forEach(charDoc => {
                const charData = charDoc.data();
                const userId = charData.userId;
                const userData = userId ? usersData[userId] : null;
                characterList.push({
                    id: charDoc.id,
                    characterName: charData.characterName || 'Unnamed',
                    userId: userId || '',
                    displayName: userData?.displayName || userData?.email || 'Unknown Player',
                    level: charData.characterLevel || 1,
                });
            });

            characterList.sort((a, b) => a.characterName.localeCompare(b.characterName));
            setCharacters(characterList);
        } catch (error) {
            console.error('Error loading characters:', error);
            toast({ title: 'Error', description: 'Failed to load characters', status: 'error' });
        } finally {
            setIsLoadingCharacters(false);
        }
    }, [toast]);

    useEffect(() => {
        loadQuests();
        loadCharacters();
    }, [loadQuests, loadCharacters]);


    // --- Form Handling ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentQuest(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberInputChange = (name: keyof Quest, value: number) => {
        setCurrentQuest(prev => ({ ...prev, [name]: value }));
    };

    // Handles changes to top-level reward fields (XP, Gold, Other)
    const handleRewardChange = (field: keyof QuestReward, value: any) => {
        setCurrentQuest(prev => ({
            ...prev,
            rewards: {
                ...(prev.rewards || { items: [] }), // Ensure rewards and items exist
                [field]: field === 'experience' || field === 'gold' ? Number(value) || 0 : value // Convert specific fields to numbers
            }
        }));
    };

    // Handles changes specifically to the reward items array
    const handleRewardItemChange = (items: RewardItem[]) => {
        handleRewardChange('items', items);
    };

    // Handler specifically for updating the quantity of an already selected reward item
    const handleRewardItemQuantityUpdate = (itemId: string, newQuantity: number) => {
        const quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity; // Ensure valid number
        setCurrentQuest(prev => {
            const currentItems = prev.rewards?.items || [];
            const updatedItems = currentItems
                .map(item => (item.id === itemId ? { ...item, quantity: quantity } : item))
                .filter(item => item.quantity > 0); // Remove item if quantity is 0
            return {
                ...prev,
                rewards: {
                    ...(prev.rewards || {}),
                    items: updatedItems,
                },
            };
        });
    };


    // --- Objective Handling ---
     const addObjective = () => {
        const newObjective: QuestObjective = {
            id: `obj-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            description: '',
            completed: false,
            type: 'other',
            currentCount: 0,
            targetCount: 1,
            target: '',
            isOptional: false,
        };
        setCurrentQuest(prev => ({
            ...prev,
            objectives: [...(prev.objectives || []), newObjective]
        }));
    };

    const updateObjective = (index: number, field: keyof QuestObjective, value: any) => {
        setCurrentQuest(prev => {
            const objectives = [...(prev.objectives || [])];
            if (objectives[index]) {
                 if ((field === 'targetCount' || field === 'currentCount') && typeof value === 'string') {
                    value = parseInt(value, 10) || 0;
                }
                 else if (field === 'isOptional' && typeof value !== 'boolean') {
                     value = !!value;
                 }
                objectives[index] = { ...objectives[index], [field]: value };
            }
            return { ...prev, objectives };
        });
    };

    const removeObjective = (index: number) => {
        setCurrentQuest(prev => ({
            ...prev,
            objectives: (prev.objectives || []).filter((_, i) => i !== index)
        }));
    };

    // --- Quest CRUD Operations ---
    const handleCreateOrUpdateQuest = async () => {
        if (!currentUser || !currentQuest.title?.trim()) {
            toast({ title: 'Error', description: 'Quest title is required', status: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            // Ensure reward items have quantity, default to 1 if missing
            const finalRewardItems = (currentQuest.rewards?.items || []).map(item => ({
                ...item,
                quantity: item.quantity || 1
            })).filter(item => item.id && item.name && item.quantity > 0); // Filter invalid

            const finalRewards: QuestReward = {
                experience: currentQuest.rewards?.experience || 0,
                gold: currentQuest.rewards?.gold || 0,
                items: finalRewardItems,
                reputation: currentQuest.rewards?.reputation || [],
                other: currentQuest.rewards?.other?.trim() || '', // Trim 'other' rewards
            };

            // Remove empty fields from rewards
            if (finalRewards.experience === 0) delete finalRewards.experience;
            if (finalRewards.gold === 0) delete finalRewards.gold;
            if (!finalRewards.items || finalRewards.items.length === 0) delete finalRewards.items;
            if (!finalRewards.reputation || finalRewards.reputation.length === 0) delete finalRewards.reputation;
            if (!finalRewards.other) delete finalRewards.other;


             const cleanedObjectives = (currentQuest.objectives || []).map(obj => ({
                id: obj.id,
                description: obj.description || 'Objective details missing',
                completed: obj.completed || false,
                type: obj.type || 'other',
                target: obj.target || '',
                targetCount: obj.targetCount || 1,
                currentCount: 0, // Reset current count on save
                isOptional: obj.isOptional || false,
             }));

            const questData = {
                title: currentQuest.title,
                description: currentQuest.description || '',
                status: currentQuest.status || 'available',
                objectives: cleanedObjectives,
                rewards: finalRewards,
                giver: currentQuest.giver || '',
                location: currentQuest.location || '',
                requiredLevel: currentQuest.requiredLevel || 1,
                prerequisites: currentQuest.prerequisites || [],
                relatedQuests: currentQuest.relatedQuests || [],
                createdBy: currentUser.uid,
                updatedAt: serverTimestamp(), // Use server timestamp
             };

            // Remove undefined fields before saving
             Object.keys(questData).forEach(key => (questData[key as keyof typeof questData] === undefined) && delete questData[key as keyof typeof questData]);


            if (isEditing && currentQuest.id) {
                const questRef = doc(db, 'quests', currentQuest.id);
                 // Explicitly cast questData for updateDoc if necessary, or ensure all fields match Quest structure
                 await updateDoc(questRef, questData);
                toast({ title: 'Quest Updated', status: 'success' });
                 // Update local state - ensure createdAt is preserved
                 const originalQuest = quests.find(q => q.id === currentQuest.id);
                 const updatedQuest = {
                     ...originalQuest, // Keep original data like createdAt
                     ...questData,     // Apply updates
                     id: currentQuest.id, // Ensure ID is present
                     createdAt: originalQuest?.createdAt || Timestamp.now(), // Preserve original timestamp
                     updatedAt: Timestamp.now(), // Add client-side timestamp for immediate UI update
                 } as Quest; // Assert type
                 setQuests(prev => prev.map(q => q.id === currentQuest.id ? updatedQuest : q));
            } else {
                // Add createdAt field for new quests
                 const finalQuestData = { ...questData, createdAt: serverTimestamp() };
                const docRef = await addDoc(collection(db, 'quests'), finalQuestData);
                toast({ title: 'Quest Created', status: 'success' });
                 // Add to local state with approximate timestamp
                 setQuests(prev => [{
                     ...finalQuestData,
                     id: docRef.id,
                     createdAt: Timestamp.now(), // Client-side approx.
                     updatedAt: Timestamp.now(),
                 } as Quest, ...prev].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())); // Re-sort
            }
            resetForm();
            onCreateClose();
        } catch (error) {
            console.error('Error saving quest:', error);
            toast({ title: 'Error Saving Quest', description: `${error}`, status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

     const handleEditQuest = (quest: Quest) => {
        setIsEditing(true);
        const questCopy = JSON.parse(JSON.stringify(quest)); // Deep copy
        setCurrentQuest({
            ...questCopy,
            rewards: { // Ensure rewards structure is correct
                ...(questCopy.rewards || {}),
                items: questCopy.rewards?.items || [],
                other: questCopy.rewards?.other || '',
            }
        });
        onCreateOpen();
    };

    const handleDeleteQuest = async () => {
        if (!questToDelete || !questToDelete.id) return;
        setIsSubmitting(true);
        try {
            await deleteDoc(doc(db, 'quests', questToDelete.id));
            setQuests(prev => prev.filter(q => q.id !== questToDelete.id));
            toast({ title: 'Quest Deleted', status: 'info' });
            setQuestToDelete(null);
            onDeleteClose();
        } catch (error) {
            console.error('Error deleting quest:', error);
            toast({ title: 'Error Deleting Quest', status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirmation = (quest: Quest) => {
        setQuestToDelete(quest);
        onDeleteOpen();
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentQuest({
            title: '', description: '', status: 'available', objectives: [],
            rewards: { items: [], other: '' }, // Reset rewards including 'other'
            giver: '', location: '', requiredLevel: 1, prerequisites: [], relatedQuests: [],
        });
    };


    // --- Quest Assignment ---
    const handleOpenAssignModal = (quest: Quest) => {
        setSelectedQuest(quest);
        setSelectedCharactersForAssign([]);
        onAssignOpen();
    };

    const handleToggleCharacterSelect = (characterId: string) => {
        setSelectedCharactersForAssign(prev =>
            prev.includes(characterId)
                ? prev.filter(id => id !== characterId)
                : [...prev, characterId]
        );
    };

    const handleAssignQuest = async () => {
        if (!currentUser || !selectedQuest || !selectedQuest.id || selectedCharactersForAssign.length === 0) {
            toast({ title: 'Error', description: 'No quest or characters selected', status: 'warning' });
            return;
        }
        setIsSubmitting(true);
        try {
             const batch = writeBatch(db);
            selectedCharactersForAssign.forEach(characterId => {
                 const character = characters.find(c => c.id === characterId);
                 if (!character) return; // Skip if character not found

                 // Create assignment data without explicit typing to allow Firestore to handle the timestamp
                 const assignmentData = {
                    questId: selectedQuest.id!,
                    characterId: characterId,
                    playerId: character.userId, // Include player's User ID
                    assignedAt: serverTimestamp(), // Firestore will convert this to Timestamp during write
                    status: 'active',
                    objectiveProgress: selectedQuest.objectives?.reduce((acc, obj) => ({ ...acc, [obj.id]: 0 }), {}) || {}
                 };
                 const assignmentRef = doc(collection(db, 'questAssignments'));
                 batch.set(assignmentRef, assignmentData);
             });

             await batch.commit();

            toast({ title: 'Quest Assigned', description: `Assigned to ${selectedCharactersForAssign.length} character(s)`, status: 'success' });
            onAssignClose();
            setSelectedCharactersForAssign([]);
        } catch (error) {
            console.error('Error assigning quest:', error);
            toast({ title: 'Error Assigning Quest', status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Filtering & Sorting ---
     const filteredQuests = quests.filter(quest => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchLower || quest.title.toLowerCase().includes(searchLower) ||
            (quest.description && quest.description.toLowerCase().includes(searchLower));
        const matchesStatus = !statusFilter || quest.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const debouncedSearch = useCallback(debounce((term) => setSearchTerm(term), 300), []);
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    // --- Rendering Functions ---
    const renderQuestForm = () => (
        <VStack spacing={4} align="stretch">
            {/* Basic Info */}
            <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input name="title" value={currentQuest.title || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600"/>
            </FormControl>
            <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={currentQuest.description || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600" placeholder="Quest details, story, context..."/>
            </FormControl>
            <HStack>
                <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select name="status" value={currentQuest.status || 'available'} onChange={handleInputChange} bg="gray.700" borderColor="gray.600">
                        <option value="available">Available</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel>Required Level</FormLabel>
                    <NumberInput min={1} value={currentQuest.requiredLevel || 1} onChange={(_, value) => handleNumberInputChange('requiredLevel', value)} bg="gray.700" borderColor="gray.600">
                        <NumberInputField />
                        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                    </NumberInput>
                </FormControl>
            </HStack>
            <HStack>
                 <FormControl>
                    <FormLabel>Quest Giver (Optional)</FormLabel>
                    <Input name="giver" placeholder="e.g., Old Man Willow" value={currentQuest.giver || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600"/>
                </FormControl>
                <FormControl>
                    <FormLabel>Location (Optional)</FormLabel>
                    <Input name="location" placeholder="e.g., Whispering Woods" value={currentQuest.location || ''} onChange={handleInputChange} bg="gray.700" borderColor="gray.600"/>
                </FormControl>
            </HStack>
            <Divider my={2} borderColor="gray.600"/>

            {/* Objectives */}
            <Heading size="sm" mt={2}>Objectives</Heading>
            {currentQuest.objectives?.map((obj, index) => (
                <Box key={obj.id || index} p={3} borderWidth="1px" borderRadius="md" position="relative" borderColor="gray.600" bg="gray.750">
                    <VStack spacing={2} align="stretch">
                         <HStack justify="space-between">
                             <FormLabel fontSize="sm" color="gray.300" mb={0}>Objective #{index + 1}</FormLabel>
                             <IconButton icon={<Trash size={14} />} aria-label="Remove objective" size="xs" colorScheme="red" variant="ghost" onClick={() => removeObjective(index)} />
                         </HStack>
                        <FormControl isRequired>
                            <Textarea size="sm" value={obj.description} onChange={(e) => updateObjective(index, 'description', e.target.value)} placeholder="Objective description" bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                        <HStack spacing={2}>
                             <FormControl size="sm">
                                <FormLabel fontSize="xs">Type</FormLabel>
                                <Select size="sm" value={obj.type} onChange={(e) => updateObjective(index, 'type', e.target.value)} bg="gray.700" borderColor="gray.600">
                                    <option value="fetch">Fetch Item</option>
                                    <option value="kill">Kill Target</option>
                                    <option value="escort">Escort NPC</option>
                                    <option value="explore">Explore Area</option>
                                    <option value="talk">Talk to NPC</option>
                                    <option value="use">Use Item</option>
                                    <option value="other">Other</option>
                                </Select>
                            </FormControl>
                             {objectiveTypeNeedsTarget(obj.type) && (
                                <FormControl size="sm">
                                    <FormLabel fontSize="xs">Target Name/ID</FormLabel>
                                    <Input size="sm" value={obj.target || ''} onChange={(e) => updateObjective(index, 'target', e.target.value)} placeholder="Item ID, NPC Name..." bg="gray.700" borderColor="gray.600"/>
                                </FormControl>
                            )}
                             {objectiveTypeNeedsCount(obj.type) && (
                                <FormControl size="sm" width="120px">
                                    <FormLabel fontSize="xs">Count Req.</FormLabel>
                                    <NumberInput size="sm" min={1} value={obj.targetCount || 1} onChange={(_, val) => updateObjective(index, 'targetCount', val)} bg="gray.700" borderColor="gray.600">
                                        <NumberInputField />
                                    </NumberInput>
                                </FormControl>
                            )}
                        </HStack>
                         <Checkbox size="sm" isChecked={obj.isOptional} onChange={(e) => updateObjective(index, 'isOptional', e.target.checked)} colorScheme="teal">Optional Objective</Checkbox>
                    </VStack>
                </Box>
            ))}
            <Button size="sm" leftIcon={<Plus />} onClick={addObjective} variant="outline" colorScheme="blue">Add Objective</Button>
            <Divider my={2} borderColor="gray.600"/>

            {/* Rewards - Updated Layout */}
            <Heading size="sm" mt={2}>Rewards</Heading>
            <Box p={3} borderWidth="1px" borderRadius="md" borderColor="gray.600" bg="gray.750">
                <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                        <FormLabel>Experience</FormLabel>
                        <NumberInput bg="gray.700" borderColor="gray.600" min={0} value={currentQuest.rewards?.experience || 0} onChange={(_, val) => handleRewardChange('experience', val)}>
                            <NumberInputField />
                        </NumberInput>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Gold</FormLabel>
                         <NumberInput bg="gray.700" borderColor="gray.600" min={0} value={currentQuest.rewards?.gold || 0} onChange={(_, val) => handleRewardChange('gold', val)}>
                            <NumberInputField />
                        </NumberInput>
                    </FormControl>
                </SimpleGrid>
                <FormControl mb={4}>
                    <FormLabel>Reward Items</FormLabel>
                    {/* Item Selection Component */}
                    <ItemSelect
                        selectedItems={[]} // Pass empty array as ItemSelect likely handles its own search/display
                        onItemSelect={(item, quantity) => { // This adds the selected item to our *quest* state
                            const rewardItem: RewardItem = { ...item, quantity };
                            const currentItems = currentQuest.rewards?.items || [];
                            const existingIndex = currentItems.findIndex(i => i.id === item.id);
                            let newItems;
                            if (existingIndex > -1) {
                                newItems = [...currentItems];
                                newItems[existingIndex] = { ...newItems[existingIndex], quantity: (newItems[existingIndex].quantity || 0) + quantity };
                            } else {
                                newItems = [...currentItems, rewardItem];
                            }
                            handleRewardItemChange(newItems.filter(i => i.quantity > 0));
                        }}
                        onItemRemove={(itemId: string) => { // This removes the item from our *quest* state
                            const newItems = (currentQuest.rewards?.items || []).filter(i => i.id !== itemId);
                            handleRewardItemChange(newItems);
                        }}
                         allowQuantityEditing={true} // Let ItemSelect handle quantity internally if it can
                    />
                </FormControl>
                 {/* NEW: Other Rewards Text Field */}
                 <FormControl>
                     <FormLabel>Other Rewards (Optional)</FormLabel>
                     <Textarea
                         name="otherRewards"
                         placeholder="Describe any other rewards, e.g., 'Faction Reputation Increase with the Guards', 'A favor from the Duke', 'Unlock a new area'"
                         value={currentQuest.rewards?.other || ''}
                         onChange={(e) => handleRewardChange('other', e.target.value)}
                         bg="gray.700"
                         borderColor="gray.600"
                         rows={2}
                    />
                 </FormControl>
            </Box>
        </VStack>
    );

    const renderQuestList = () => (
        <ScrollArea className="h-[600px]">
            <TableContainer>
                <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                        <Tr>
                            <Th color="gray.300" borderColor="gray.600">Title</Th><Th color="gray.300" borderColor="gray.600">Status</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600">Level</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600">Location</Th>{/* --- FIX: Removed whitespace --- */}<Th color="gray.300" borderColor="gray.600" textAlign="right">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredQuests.map(quest => (
                            <Tr key={quest.id} _hover={{ bg: 'gray.750' }}>
                                <Td borderColor="gray.600">
                                    <Tooltip label={quest.description} placement="top-start" bg="gray.600" color="white" hasArrow>
                                        <Text fontWeight="medium" noOfLines={1} color="gray.100">{quest.title}</Text>
                                    </Tooltip>
                                </Td>
                                <Td borderColor="gray.600"><Badge colorScheme={getStatusColorScheme(quest.status)}>{quest.status}</Badge></Td>
                                <Td color="gray.400" borderColor="gray.600">{quest.requiredLevel || '-'}</Td>
                                <Td color="gray.400" borderColor="gray.600">{quest.location || '-'}</Td>
                                <Td borderColor="gray.600" textAlign="right">
                                    <HStack spacing={1} justify="flex-end">
                                        <Tooltip label="Assign Quest"><IconButton icon={<Send size={14} />} aria-label="Assign Quest" size="xs" variant="ghost" colorScheme="blue" onClick={() => handleOpenAssignModal(quest)} /></Tooltip>
                                        <Tooltip label="Edit Quest"><IconButton icon={<Edit size={14} />} aria-label="Edit Quest" size="xs" variant="ghost" colorScheme="yellow" onClick={() => handleEditQuest(quest)} /></Tooltip>
                                        <Tooltip label="Delete Quest"><IconButton icon={<Trash size={14} />} aria-label="Delete Quest" size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(quest)} /></Tooltip>
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            {filteredQuests.length === 0 && !isLoadingQuests && (
                 <Center py={10}><Text color="gray.500">No quests found matching criteria.</Text></Center>
            )}
            {isLoadingQuests && (
                 <Center py={10}><Spinner size="lg" color="brand.400"/></Center>
            )}
        </ScrollArea>
    );


    return (
        <Box p={4}>
            <HStack mb={4} justify="space-between">
                <Heading size="lg" display="flex" alignItems="center" color="gray.100">
                     <BookOpen className="mr-2 text-brand-400"/> Quest Management
                </Heading>
                <Button leftIcon={<Plus />} colorScheme="brand" onClick={() => { resetForm(); onCreateOpen(); }}>
                    Create Quest
                </Button>
            </HStack>

             <HStack mb={4} spacing={4}>
                 <InputGroup size="sm" flex={1}>
                    <InputLeftElement pointerEvents="none"><Search size={16} color="gray.500" /></InputLeftElement>
                    <Input placeholder="Search quests..." onChange={handleSearchChange} bg="gray.700" borderColor="gray.600" pl={8}/>
                 </InputGroup>
                 <Select size="sm" placeholder="Filter by Status" onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} bg="gray.700" borderColor="gray.600" maxWidth="200px">
                     <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                 </Select>
            </HStack>

            {isLoadingQuests ? <Center py={10}><Spinner size="xl" color="brand.400"/></Center> : renderQuestList()}

            {/* Create/Edit Quest Modal */}
            <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay bg="blackAlpha.600"/>
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderColor="gray.700">{isEditing ? 'Edit Quest' : 'Create New Quest'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                         {/* Wrapped form content in ScrollArea */}
                         <ScrollArea className="h-[70vh]">
                            {renderQuestForm()}
                         </ScrollArea>
                    </ModalBody>
                    <ModalFooter borderTop="1px" borderColor="gray.700">
                        <Button variant="ghost" mr={3} onClick={onCreateClose}>Cancel</Button>
                        <Button colorScheme="brand" isLoading={isSubmitting} onClick={handleCreateOrUpdateQuest} leftIcon={isEditing ? <Save size={16} /> : <Plus size={16} />}>
                            {isEditing ? 'Save Changes' : 'Create Quest'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Assign Quest Modal */}
            <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="xl" scrollBehavior='inside'>
                 <ModalOverlay bg="blackAlpha.600" />
                <ModalContent bg="gray.800" color="gray.100">
                    <ModalHeader borderColor="gray.700">Assign Quest: {selectedQuest?.title}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                         {isLoadingCharacters ? <Center><Spinner color="brand.400"/></Center> :
                             <VStack spacing={4} align="stretch">
                                 <Text>Select characters to assign this quest to:</Text>
                                 <ScrollArea className="h-[40vh] border border-gray-700 rounded-md p-2">
                                    <VStack spacing={2} align="stretch">
                                        {characters.length === 0 ? <Text color="gray.500" textAlign="center">No characters found.</Text> :
                                        characters.map(char => (
                                            <HStack key={char.id} p={2} bg="gray.700" borderRadius="md" justify="space-between" _hover={{bg: "gray.600"}}>
                                                <Checkbox isChecked={selectedCharactersForAssign.includes(char.id)} onChange={() => handleToggleCharacterSelect(char.id)} colorScheme="brand">
                                                    {char.characterName} <Text as="span" fontSize="xs" color="gray.400">(Lvl {char.level})</Text>
                                                </Checkbox>
                                                <Badge>User: {char.displayName}</Badge>
                                            </HStack>
                                        ))}
                                    </VStack>
                                 </ScrollArea>
                                 <Text fontSize="sm" color="gray.400">{selectedCharactersForAssign.length} selected</Text>
                             </VStack>}
                    </ModalBody>
                    <ModalFooter borderTop="1px" borderColor="gray.700">
                        <Button variant="ghost" mr={3} onClick={onAssignClose}>Cancel</Button>
                        <Button colorScheme="brand" isLoading={isSubmitting} onClick={handleAssignQuest} isDisabled={selectedCharactersForAssign.length === 0 || isLoadingCharacters} leftIcon={<Send size={16} />}>
                             Assign Quest
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
             <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
                 <AlertDialogOverlay><AlertDialogContent bg="gray.800" color="gray.100">
                        <AlertDialogHeader fontSize="lg" fontWeight="bold" borderColor="gray.700">Delete Quest</AlertDialogHeader>
                         <AlertDialogBody>Are you sure you want to delete "{questToDelete?.title}"? This cannot be undone.</AlertDialogBody>
                         <AlertDialogFooter borderTop="1px" borderColor="gray.700">
                            <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost">Cancel</Button>
                            <Button colorScheme="red" onClick={handleDeleteQuest} ml={3} isLoading={isSubmitting}>Delete</Button>
                        </AlertDialogFooter>
                 </AlertDialogContent></AlertDialogOverlay>
            </AlertDialog>

        </Box>
    );
};

export default DMQuestManager;