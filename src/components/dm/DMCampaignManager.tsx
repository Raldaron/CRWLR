// components/dm/DMCampaignManager.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader, // Added CardHeader
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    ListItem, // Added List components
    ListIcon,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    SimpleGrid,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    VStack,
    Badge,
    Divider,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Center,
    Tooltip, // Added Tooltip
    OrderedList, // Added OrderedList
} from '@chakra-ui/react';
import {
    Calendar,
    Users,
    MapPin, // Added MapPin
    BookOpen, // Added BookOpen
    Plus,
    Edit,
    Trash,
    Save,
    Search,
    AlertTriangle,
    History, // Using History icon instead of Timeline
    Link as LinkIcon, // For linking entities
    ChevronDown, // For collapsing/expanding arcs
    ChevronRight,
    Network, // For relationships
    FileText, // For notes/description
} from 'lucide-react';
import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
    where,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext'; // Assuming auth context exists
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Interfaces ---

interface CampaignEvent {
    id: string;
    title: string;
    description: string;
    gameDate?: string; // Store as string for simplicity (e.g., "Day 10, Month of Sun", "Year 3, Era of Storms")
    location?: string; // Optional location name/ID
    linkedNpcIds?: string[]; // IDs of NPCs involved
    linkedQuestIds?: string[]; // IDs of related Quests
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

interface NPCRelationship {
    npcId: string; // ID of the related NPC
    npcName?: string; // Name for display (optional, might fetch later)
    relationshipType: string; // e.g., "Ally", "Enemy", "Family", "Rival"
    notes?: string; // Details about the relationship
}

interface CampaignNPC {
    id: string;
    name: string;
    description?: string; // Physical appearance, mannerisms
    personality?: string;
    background?: string;
    secrets?: string; // Info only DM knows
    motivations?: string;
    location?: string; // Current or primary location name/ID
    faction?: string; // Faction name/ID
    relationships?: NPCRelationship[];
    notes?: string; // General DM notes
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

interface StoryArc {
    id: string;
    title: string;
    description: string;
    status: 'Planned' | 'Active' | 'Completed' | 'Abandoned';
    parentArcId?: string | null; // For hierarchy
    order?: number; // For sorting within a level
    linkedQuestIds?: string[];
    linkedNpcIds?: string[];
    linkedEventIds?: string[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

// --- Main Component ---

const DMCampaignManager: React.FC = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

    // Data States
    const [events, setEvents] = useState<CampaignEvent[]>([]);
    const [npcs, setNpcs] = useState<CampaignNPC[]>([]);
    const [storyArcs, setStoryArcs] = useState<StoryArc[]>([]);

    // Loading States
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingNPCs, setIsLoadingNPCs] = useState(true);
    const [isLoadingArcs, setIsLoadingArcs] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal States & Controls
    const { isOpen: isEventModalOpen, onOpen: onOpenEventModal, onClose: onCloseEventModal } = useDisclosure();
    const { isOpen: isNPCModalOpen, onOpen: onOpenNPCModal, onClose: onCloseNPCModal } = useDisclosure();
    const { isOpen: isArcModalOpen, onOpen: onOpenArcModal, onClose: onCloseArcModal } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();

    // Editing/Selection States
    const [isEditing, setIsEditing] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Partial<CampaignEvent> | null>(null);
    const [currentNPC, setCurrentNPC] = useState<Partial<CampaignNPC> | null>(null);
    const [currentArc, setCurrentArc] = useState<Partial<StoryArc> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'event' | 'npc' | 'arc'; name: string } | null>(null);

    // Search States
    const [npcSearchTerm, setNpcSearchTerm] = useState('');
    const [arcSearchTerm, setArcSearchTerm] = useState('');

    const cancelRef = useRef<HTMLButtonElement>(null!);

    // --- Data Fetching ---

    const fetchData = useCallback(async (collectionName: string, setData: Function, setIsLoading: Function, orderByField = 'createdAt') => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const collRef = collection(db, `users/${currentUser.uid}/${collectionName}`); // Path corrected to be user-specific
            // Example: Filter by campaign ID if needed in future: query(collRef, where('campaignId', '==', currentCampaignId), orderBy(orderByField))
            const q = query(collRef, orderBy(orderByField, 'desc')); // Order by creation time desc by default
            const snapshot = await getDocs(q);
            const dataList = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setData(dataList);
        } catch (error) {
            console.error(`Error loading ${collectionName}:`, error);
            toast({ title: `Error Loading ${collectionName}`, status: 'error', duration: 3000 });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, toast]);

    useEffect(() => {
        if (currentUser) {
            // Assuming these collections are directly under the user's document
            fetchData('campaignTimeline', setEvents, setIsLoadingEvents, 'gameDate'); // Or createdAt if gameDate is complex
            fetchData('campaignNPCs', setNpcs, setIsLoadingNPCs, 'name');
            fetchData('campaignStoryArcs', setStoryArcs, setIsLoadingArcs, 'order'); // Or createdAt
        } else {
            setIsLoadingEvents(false);
            setIsLoadingNPCs(false);
            setIsLoadingArcs(false);
            setEvents([]);
            setNpcs([]);
            setStoryArcs([]);
        }
    }, [fetchData, currentUser]); // Add currentUser dependency


    // --- Filtering ---
    const filteredNPCs = useMemo(() => npcs.filter(npc =>
        npc.name.toLowerCase().includes(npcSearchTerm.toLowerCase()) ||
        (npc.location && npc.location.toLowerCase().includes(npcSearchTerm.toLowerCase())) ||
        (npc.faction && npc.faction.toLowerCase().includes(npcSearchTerm.toLowerCase()))
    ), [npcs, npcSearchTerm]);

    const filteredArcs = useMemo(() => storyArcs.filter(arc =>
        arc.title.toLowerCase().includes(arcSearchTerm.toLowerCase()) ||
        arc.description.toLowerCase().includes(arcSearchTerm.toLowerCase())
    ), [storyArcs, arcSearchTerm]);

    // --- CRUD Functions ---

    const handleOpenModal = (type: 'event' | 'npc' | 'arc', data: any | null = null) => {
        setIsEditing(!!data);
        if (type === 'event') {
            setCurrentEvent(data ? { ...data } : { title: '', description: '' });
            onOpenEventModal();
        } else if (type === 'npc') {
            setCurrentNPC(data ? { ...data, relationships: data.relationships || [] } : { name: '', relationships: [] }); // Ensure relationships array exists
            onOpenNPCModal();
        } else if (type === 'arc') {
            setCurrentArc(data ? { ...data } : { title: '', description: '', status: 'Planned', parentArcId: null });
            onOpenArcModal();
        }
    };

    const handleSave = async (type: 'event' | 'npc' | 'arc') => {
        if (!currentUser) return;
        let currentData: any;
        let collectionName: string;
        let setData: Function;
        let currentList: any[];

        if (type === 'event') {
            currentData = currentEvent;
            collectionName = 'campaignTimeline';
            setData = setEvents;
            currentList = events;
            if (!currentData?.title?.trim()) { toast({ title: 'Title Required', status: 'warning' }); return; }
        } else if (type === 'npc') {
            currentData = currentNPC;
            collectionName = 'campaignNPCs';
            setData = setNpcs;
            currentList = npcs;
            if (!currentData?.name?.trim()) { toast({ title: 'Name Required', status: 'warning' }); return; }
        } else if (type === 'arc') {
            currentData = currentArc;
            collectionName = 'campaignStoryArcs';
            setData = setStoryArcs;
            currentList = storyArcs;
            if (!currentData?.title?.trim()) { toast({ title: 'Title Required', status: 'warning' }); return; }
        } else {
            return;
        }

        setIsSaving(true);
        const { id, ...dataToSave } = currentData; // Separate ID
        dataToSave.updatedAt = serverTimestamp();
        dataToSave.userId = currentUser.uid; // Ensure userId is associated

        try {
             const userSpecificCollection = `users/${currentUser.uid}/${collectionName}`; // Path for saving/updating
            if (isEditing && id) {
                await updateDoc(doc(db, userSpecificCollection, id), dataToSave);
                // Manually add server timestamp to local state for immediate feedback
                const updatedDataWithTimestamp = { ...dataToSave, updatedAt: Timestamp.now() };
                setData(currentList.map(item => item.id === id ? { ...item, ...updatedDataWithTimestamp, id } : item)); // Update local state
                toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Updated`, status: 'success' });
            } else {
                dataToSave.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, userSpecificCollection), dataToSave);
                // Manually add server timestamp to local state for immediate feedback
                 const newDataWithTimestamp = { ...dataToSave, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
                setData([{ id: docRef.id, ...newDataWithTimestamp }, ...currentList]); // Add to local state
                toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Created`, status: 'success' });
            }
            // Close the correct modal
            if (type === 'event') onCloseEventModal();
            else if (type === 'npc') onCloseNPCModal();
            else if (type === 'arc') onCloseArcModal();
        } catch (error) {
            console.error(`Error saving ${type}:`, error);
            toast({ title: `Error Saving ${type}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete || !currentUser) return;
        setIsSaving(true); // Use saving state for delete operation indication
        try {
             const collectionPath = `users/${currentUser.uid}/campaign${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)}s`;
            await deleteDoc(doc(db, collectionPath, itemToDelete.id)); // Construct collection name

            if (itemToDelete.type === 'event') setEvents(prev => prev.filter(item => item.id !== itemToDelete.id));
            else if (itemToDelete.type === 'npc') setNpcs(prev => prev.filter(item => item.id !== itemToDelete.id));
            else if (itemToDelete.type === 'arc') setStoryArcs(prev => prev.filter(item => item.id !== itemToDelete.id));

            toast({ title: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} Deleted`, status: 'info' });
            setItemToDelete(null);
            onCloseDeleteModal();
        } catch (error) {
            console.error(`Error deleting ${itemToDelete.type}:`, error);
            toast({ title: `Error Deleting ${itemToDelete.type}`, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteConfirmation = (id: string, type: 'event' | 'npc' | 'arc', name: string) => {
        setItemToDelete({ id, type, name });
        onOpenDeleteModal();
    };

    // Helper to update nested state (for modals)
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, type: 'event' | 'npc' | 'arc') => {
        const { name, value } = e.target;
        if (type === 'event' && currentEvent) setCurrentEvent(prev => ({ ...prev, [name]: value }));
        else if (type === 'npc' && currentNPC) setCurrentNPC(prev => ({ ...prev, [name]: value }));
        else if (type === 'arc' && currentArc) setCurrentArc(prev => ({ ...prev, [name]: value }));
    };

    // --- Specific Handlers for Complex Fields (NPC Relationships) ---
    const addNPCRelationship = () => {
        if (!currentNPC) return;
        const newRelationship: NPCRelationship = { npcId: '', relationshipType: 'Ally', notes: '' };
        setCurrentNPC(prev => ({
            ...prev,
            relationships: [...(prev?.relationships || []), newRelationship]
        }));
    };

    const updateNPCRelationship = (index: number, field: keyof NPCRelationship, value: string) => {
        if (!currentNPC || !currentNPC.relationships) return;
        const updatedRelationships = [...currentNPC.relationships];
        if (updatedRelationships[index]) {
            updatedRelationships[index] = { ...updatedRelationships[index], [field]: value };
             // If npcId is changed, update npcName if possible (simple version for now)
             if (field === 'npcId') {
                 const relatedNpc = npcs.find(npc => npc.id === value);
                 updatedRelationships[index].npcName = relatedNpc?.name || 'Unknown NPC';
             }
            setCurrentNPC(prev => ({ ...prev, relationships: updatedRelationships }));
        }
    };

    const removeNPCRelationship = (index: number) => {
        if (!currentNPC || !currentNPC.relationships) return;
        setCurrentNPC(prev => ({
            ...prev,
            relationships: prev?.relationships?.filter((_, i) => i !== index)
        }));
    };

    // --- Render Functions ---

    const renderTimeline = () => (
        <Box>
            <Flex mb={4} justify="flex-end">
                <Button size="sm" colorScheme="blue" leftIcon={<Plus size={16}/>} onClick={() => handleOpenModal('event')}>Add Event</Button>
            </Flex>
             {isLoadingEvents ? <Center><Spinner color="brand.400" /></Center> :
              events.length === 0 ? <Center py={10}><Text color="gray.500">No timeline events created yet.</Text></Center> :
              <ScrollArea className="h-[65vh]">
                 <OrderedList spacing={3}>
                     {events.sort((a,b) => (a.gameDate || "").localeCompare(b.gameDate || "")).map(event => ( // Sort by gameDate string for now
                         <ListItem key={event.id} p={3} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                             <Flex justify="space-between" align="start">
                                 <Box>
                                     <HStack mb={1}>
                                        {event.gameDate && <Badge colorScheme="cyan">{event.gameDate}</Badge>}
                                        <Text fontWeight="bold" color="gray.100">{event.title}</Text>
                                     </HStack>
                                     <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">{event.description}</Text>
                                     {/* Optional: Display linked items */}
                                     {(event.location || event.linkedNpcIds?.length || event.linkedQuestIds?.length) && (
                                        <HStack mt={2} spacing={4} fontSize="xs" color="gray.400">
                                           {event.location && <HStack><MapPin size={12} /><Text>{event.location}</Text></HStack>}
                                           {event.linkedNpcIds?.length && <HStack><Users size={12} /><Text>{event.linkedNpcIds.length} NPC(s)</Text></HStack>}
                                           {event.linkedQuestIds?.length && <HStack><BookOpen size={12} /><Text>{event.linkedQuestIds.length} Quest(s)</Text></HStack>}
                                        </HStack>
                                     )}
                                 </Box>
                                 <HStack spacing={1}>
                                     <Tooltip label="Edit Event"><IconButton icon={<Edit size={14} />} aria-label="Edit event" size="xs" variant="ghost" colorScheme="yellow" onClick={() => handleOpenModal('event', event)}/></Tooltip>
                                     <Tooltip label="Delete Event"><IconButton icon={<Trash size={14} />} aria-label="Delete event" size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(event.id, 'event', event.title)}/></Tooltip>
                                 </HStack>
                             </Flex>
                         </ListItem>
                     ))}
                 </OrderedList>
              </ScrollArea>}
        </Box>
    );

    const renderNPCDirectory = () => (
        <Box>
            <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={2}>
                <InputGroup size="sm" maxW="300px">
                    <InputLeftElement pointerEvents="none"><Search size={16} color="gray.400" /></InputLeftElement>
                    <Input placeholder="Search NPCs..." value={npcSearchTerm} onChange={(e) => setNpcSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8}/>
                </InputGroup>
                <Button size="sm" colorScheme="blue" leftIcon={<Plus size={16}/>} onClick={() => handleOpenModal('npc')}>Add NPC</Button>
            </Flex>
            {isLoadingNPCs ? <Center><Spinner color="brand.400" /></Center> :
             filteredNPCs.length === 0 ? <Center py={10}><Text color="gray.500">No NPCs found or created.</Text></Center> :
             <ScrollArea className="h-[65vh]">
                 <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                     {filteredNPCs.map(npc => (
                         <Card key={npc.id} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                             <CardHeader pb={2}>
                                 <Flex justify="space-between" align="start">
                                     <Box>
                                        <Heading size="sm" color="gray.100">{npc.name}</Heading>
                                        <HStack mt={1}>
                                            {npc.location && <Badge variant="outline" fontSize="xs">{npc.location}</Badge>}
                                            {npc.faction && <Badge colorScheme="purple" fontSize="xs">{npc.faction}</Badge>}
                                        </HStack>
                                     </Box>
                                      <HStack spacing={1}>
                                         <Tooltip label="Edit NPC"><IconButton icon={<Edit size={14} />} aria-label="Edit NPC" size="xs" variant="ghost" colorScheme="yellow" onClick={() => handleOpenModal('npc', npc)}/></Tooltip>
                                         <Tooltip label="Delete NPC"><IconButton icon={<Trash size={14} />} aria-label="Delete NPC" size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(npc.id, 'npc', npc.name)}/></Tooltip>
                                     </HStack>
                                 </Flex>
                             </CardHeader>
                             <CardBody pt={1}>
                                 <Text fontSize="sm" color="gray.300" noOfLines={3}>{npc.description || npc.personality || npc.background || "No details provided."}</Text>
                                 {/* Could add a "View More" button here to open the modal */}
                             </CardBody>
                         </Card>
                     ))}
                 </SimpleGrid>
              </ScrollArea>}
        </Box>
    );

    const renderStoryArcs = () => (
        <Box>
             <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={2}>
                 <InputGroup size="sm" maxW="300px">
                    <InputLeftElement pointerEvents="none"><Search size={16} color="gray.400" /></InputLeftElement>
                    <Input placeholder="Search arcs..." value={arcSearchTerm} onChange={(e) => setArcSearchTerm(e.target.value)} bg="gray.700" borderColor="gray.600" pl={8}/>
                </InputGroup>
                <Button size="sm" colorScheme="blue" leftIcon={<Plus size={16}/>} onClick={() => handleOpenModal('arc')}>Add Story Arc</Button>
            </Flex>
             {isLoadingArcs ? <Center><Spinner color="brand.400" /></Center> :
              filteredArcs.length === 0 ? <Center py={10}><Text color="gray.500">No story arcs created yet.</Text></Center> :
              <ScrollArea className="h-[65vh]">
                 <List spacing={3}>
                     {/* TODO: Implement hierarchical display if needed */}
                     {filteredArcs.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(arc => ( // Sort by order
                         <ListItem key={arc.id} p={3} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                             <Flex justify="space-between" align="start">
                                 <Box>
                                     <HStack mb={1}>
                                        <Badge colorScheme={arc.status === 'Completed' ? 'green' : arc.status === 'Active' ? 'yellow' : 'blue'}>{arc.status}</Badge>
                                        <Text fontWeight="bold" color="gray.100">{arc.title}</Text>
                                     </HStack>
                                     <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">{arc.description}</Text>
                                     {/* Optional: Display linked items */}
                                     {(arc.linkedQuestIds?.length || arc.linkedNpcIds?.length || arc.linkedEventIds?.length) && (
                                         <HStack mt={2} spacing={4} fontSize="xs" color="gray.400">
                                           {arc.linkedQuestIds?.length && <HStack><BookOpen size={12} /><Text>{arc.linkedQuestIds.length} Quest(s)</Text></HStack>}
                                           {arc.linkedNpcIds?.length && <HStack><Users size={12} /><Text>{arc.linkedNpcIds.length} NPC(s)</Text></HStack>}
                                           {arc.linkedEventIds?.length && <HStack><Calendar size={12} /><Text>{arc.linkedEventIds.length} Event(s)</Text></HStack>}
                                        </HStack>
                                     )}
                                 </Box>
                                 <HStack spacing={1}>
                                     <Tooltip label="Edit Arc"><IconButton icon={<Edit size={14} />} aria-label="Edit arc" size="xs" variant="ghost" colorScheme="yellow" onClick={() => handleOpenModal('arc', arc)}/></Tooltip>
                                     <Tooltip label="Delete Arc"><IconButton icon={<Trash size={14} />} aria-label="Delete arc" size="xs" variant="ghost" colorScheme="red" onClick={() => openDeleteConfirmation(arc.id, 'arc', arc.title)}/></Tooltip>
                                 </HStack>
                             </Flex>
                         </ListItem>
                     ))}
                 </List>
              </ScrollArea>}
        </Box>
    );

    // --- Modals ---

    const renderEventModal = () => (
        <Modal isOpen={isEventModalOpen} onClose={onCloseEventModal} size="xl">
            <ModalOverlay />
            <ModalContent bg="gray.800" color="gray.100">
                <ModalHeader>{isEditing ? 'Edit Campaign Event' : 'Add Campaign Event'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Event Title</FormLabel>
                            <Input name="title" value={currentEvent?.title || ''} onChange={(e) => handleModalInputChange(e, 'event')} bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Game Date/Time</FormLabel>
                            <Input name="gameDate" placeholder="e.g., Day 15, Year 2" value={currentEvent?.gameDate || ''} onChange={(e) => handleModalInputChange(e, 'event')} bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea name="description" value={currentEvent?.description || ''} onChange={(e) => handleModalInputChange(e, 'event')} bg="gray.700" borderColor="gray.600" rows={4}/>
                        </FormControl>
                         <FormControl>
                            <FormLabel>Location (Optional)</FormLabel>
                            <Input name="location" placeholder="Location Name or ID" value={currentEvent?.location || ''} onChange={(e) => handleModalInputChange(e, 'event')} bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                         {/* TODO: Add inputs/selects for linked NPCs and Quests */}
                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px" borderColor="gray.700">
                    <Button variant="ghost" mr={3} onClick={onCloseEventModal}>Cancel</Button>
                    <Button colorScheme="brand" isLoading={isSaving} onClick={() => handleSave('event')} leftIcon={<Save size={16} />}>Save Event</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    const renderNPCModal = () => (
        <Modal isOpen={isNPCModalOpen} onClose={onCloseNPCModal} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent bg="gray.800" color="gray.100">
                <ModalHeader>{isEditing ? 'Edit NPC' : 'Add NPC'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel>NPC Name</FormLabel>
                            <Input name="name" value={currentNPC?.name || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                         <SimpleGrid columns={2} spacing={4}>
                             <FormControl>
                                <FormLabel>Location</FormLabel>
                                <Input name="location" placeholder="e.g., The Rusty Flagon" value={currentNPC?.location || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600"/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Faction</FormLabel>
                                <Input name="faction" placeholder="e.g., Merchant's Guild" value={currentNPC?.faction || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600"/>
                            </FormControl>
                         </SimpleGrid>
                        <FormControl>
                            <FormLabel>Description (Appearance, Mannerisms)</FormLabel>
                            <Textarea name="description" value={currentNPC?.description || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={3}/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Personality</FormLabel>
                            <Textarea name="personality" value={currentNPC?.personality || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={2}/>
                        </FormControl>
                         <FormControl>
                            <FormLabel>Background / History</FormLabel>
                            <Textarea name="background" value={currentNPC?.background || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={3}/>
                        </FormControl>
                         <FormControl>
                            <FormLabel>Secrets (DM Only)</FormLabel>
                            <Textarea name="secrets" value={currentNPC?.secrets || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={2}/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Motivations / Goals</FormLabel>
                            <Textarea name="motivations" value={currentNPC?.motivations || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={2}/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>General DM Notes</FormLabel>
                            <Textarea name="notes" value={currentNPC?.notes || ''} onChange={(e) => handleModalInputChange(e, 'npc')} bg="gray.700" borderColor="gray.600" rows={3}/>
                        </FormControl>

                         <Divider borderColor="gray.600" />
                         <Heading size="sm" color="gray.300">Relationships</Heading>
                         <VStack spacing={2} align="stretch">
                             {(currentNPC?.relationships || []).map((rel, index) => (
                                <HStack key={index} p={2} bg="gray.750" borderRadius="md" spacing={2}>
                                     <Select size="sm" flex={1} value={rel.npcId} onChange={(e) => updateNPCRelationship(index, 'npcId', e.target.value)} bg="gray.700" borderColor="gray.600" placeholder="Select NPC">
                                         {npcs.filter(n => n.id !== currentNPC?.id).map(npcOption => ( // Exclude self
                                             <option key={npcOption.id} value={npcOption.id}>{npcOption.name}</option>
                                         ))}
                                     </Select>
                                     <Input size="sm" flex={1} placeholder="Relationship Type (Ally, Enemy...)" value={rel.relationshipType} onChange={(e) => updateNPCRelationship(index, 'relationshipType', e.target.value)} bg="gray.700" borderColor="gray.600"/>
                                     <Input size="sm" flex={1} placeholder="Notes..." value={rel.notes || ''} onChange={(e) => updateNPCRelationship(index, 'notes', e.target.value)} bg="gray.700" borderColor="gray.600"/>
                                     <IconButton icon={<Trash size={14}/>} aria-label="Remove relationship" size="xs" colorScheme="red" variant="ghost" onClick={() => removeNPCRelationship(index)} />
                                </HStack>
                             ))}
                         </VStack>
                         <Button size="xs" leftIcon={<Plus size={14}/>} variant="outline" onClick={addNPCRelationship}>Add Relationship</Button>

                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px" borderColor="gray.700">
                    <Button variant="ghost" mr={3} onClick={onCloseNPCModal}>Cancel</Button>
                    <Button colorScheme="brand" isLoading={isSaving} onClick={() => handleSave('npc')} leftIcon={<Save size={16} />}>Save NPC</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    const renderArcModal = () => (
        <Modal isOpen={isArcModalOpen} onClose={onCloseArcModal} size="xl">
            <ModalOverlay />
            <ModalContent bg="gray.800" color="gray.100">
                <ModalHeader>{isEditing ? 'Edit Story Arc' : 'Add Story Arc'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                     <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Arc Title</FormLabel>
                            <Input name="title" value={currentArc?.title || ''} onChange={(e) => handleModalInputChange(e, 'arc')} bg="gray.700" borderColor="gray.600"/>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea name="description" value={currentArc?.description || ''} onChange={(e) => handleModalInputChange(e, 'arc')} bg="gray.700" borderColor="gray.600" rows={4}/>
                        </FormControl>
                         <FormControl>
                            <FormLabel>Status</FormLabel>
                             <Select name="status" value={currentArc?.status || 'Planned'} onChange={(e) => handleModalInputChange(e, 'arc')} bg="gray.700" borderColor="gray.600">
                                <option value="Planned">Planned</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Abandoned">Abandoned</option>
                            </Select>
                        </FormControl>
                         {/* Optional: Parent Arc Selection for Hierarchy */}
                         {/* <FormControl>
                            <FormLabel>Parent Arc (Optional)</FormLabel>
                             <Select name="parentArcId" value={currentArc?.parentArcId || ''} onChange={(e) => handleModalInputChange(e, 'arc')} placeholder="None (Top Level)" bg="gray.700" borderColor="gray.600">
                                {storyArcs.filter(a => a.id !== currentArc?.id).map(arcOption => ( // Exclude self
                                    <option key={arcOption.id} value={arcOption.id}>{arcOption.title}</option>
                                ))}
                            </Select>
                        </FormControl> */}
                          {/* TODO: Add inputs/selects for linked Quests, NPCs, Events */}
                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px" borderColor="gray.700">
                    <Button variant="ghost" mr={3} onClick={onCloseArcModal}>Cancel</Button>
                    <Button colorScheme="brand" isLoading={isSaving} onClick={() => handleSave('arc')} leftIcon={<Save size={16} />}>Save Arc</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );

    const renderDeleteConfirmationModal = () => (
         <AlertDialog isOpen={isDeleteModalOpen} leastDestructiveRef={cancelRef} onClose={onCloseDeleteModal}>
            <AlertDialogOverlay>
              <AlertDialogContent bg="gray.800" color="gray.100">
                <AlertDialogHeader fontSize="lg" fontWeight="bold"><HStack><AlertTriangle className="text-red-400"/><span>Confirm Deletion</span></HStack></AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onCloseDeleteModal} variant="ghost">Cancel</Button>
                  <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isSaving}>Delete</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
         </AlertDialog>
    );


    // --- Main Return ---
    return (
        <Box>
            <Tabs isLazy variant="soft-rounded" colorScheme="brand">
                <TabList mb={4}>
                    <Tab><HStack><History size={16} /><Text ml={2}>Timeline</Text></HStack></Tab>
                    <Tab><HStack><Users size={16} /><Text ml={2}>NPCs</Text></HStack></Tab>
                    <Tab><HStack><FileText size={16} /><Text ml={2}>Story Arcs</Text></HStack></Tab>
                </TabList>
                <TabPanels>
                    <TabPanel p={0}>{renderTimeline()}</TabPanel>
                    <TabPanel p={0}>{renderNPCDirectory()}</TabPanel>
                    <TabPanel p={0}>{renderStoryArcs()}</TabPanel>
                </TabPanels>
            </Tabs>

            {/* Modals */}
            {renderEventModal()}
            {renderNPCModal()}
            {renderArcModal()}
            {renderDeleteConfirmationModal()}
        </Box>
    );
};

export default DMCampaignManager;