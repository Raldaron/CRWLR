// pages/admin/quests.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Heading, VStack, Text, Button, Modal, ModalOverlay, ModalContent, ModalBody,
    ModalCloseButton, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, Spinner,
    HStack, Breadcrumb, BreadcrumbItem, BreadcrumbLink, IconButton
} from '@chakra-ui/react';
import { Plus, List, Send, Activity, Home, ChevronRight, Book, Trash } from 'lucide-react';
import DMQuestEditor from '@/components/admin/quests/DMQuestEditor';
import DMQuestAssignment from '@/components/admin/quests/DMQuestAssignment';
import DMQuestTracker from '@/components/admin/quests/DMQuestTracker';
import { useAuth } from '@/context/AuthContext';
import { useDM } from '@/context/DMContext';
import Link from 'next/link';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea is available
import { Quest } from '@/types/quest';

interface DMQuestListPageProps {
    onEditQuest: (quest: Quest) => void;
}

const DMQuestListPage: React.FC<DMQuestListPageProps> = ({ onEditQuest }) => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadQuests = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'quests')); // Add sorting/filtering if needed
            const snapshot = await getDocs(q);
            setQuests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest)));
        } catch (error) {
            console.error("Error loading quests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQuests();
    }, []);

    const handleDeleteQuest = async (questId: string, questTitle: string) => {
        // Function definition expects strings
        if (!window.confirm(`Are you sure you want to delete the quest "${questTitle}"? This cannot be undone.`)) {
            return;
        }
        try {
            await deleteDoc(doc(db, 'quests', questId));
            setQuests(prev => prev.filter(q => q.id !== questId));
            // Optional: Add toast notification
        } catch (error) {
            console.error("Error deleting quest:", error);
            // Optional: Add error toast
        }
    };


    if (isLoading) {
        return <Spinner color="brand.400"/>;
    }

    return (
         <ScrollArea className="h-[500px]">
            <VStack align="stretch" spacing={3}>
                {quests.length === 0 ? (
                    <Text color="gray.500">No quests created yet.</Text>
                ) : (
                    quests.map(quest => (
                        <Box key={quest.id} p={3} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                            <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold" color="gray.200">{quest.title}</Text>
                                    <Text fontSize="sm" color="gray.400" noOfLines={1}>{quest.description || 'No description'}</Text>
                                </VStack>
                                <HStack spacing={1}>
                                    <Button size="xs" variant="outline" colorScheme="blue" onClick={() => onEditQuest(quest)}>Edit</Button>
                                    <IconButton
                                        aria-label="Delete Quest"
                                        icon={<Trash size={14} />}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => {
                                            if (quest.id && quest.title) {
                                                handleDeleteQuest(quest.id, quest.title);
                                            } else {
                                                console.error("Cannot delete quest without ID and Title", quest);
                                            }
                                        }}
                                    />
                                </HStack>
                            </HStack>
                        </Box>
                    ))
                )}
            </VStack>
        </ScrollArea>
    );
};


const DMQuestManagementPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { isDM, isLoading: isDMLoading } = useDM();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [refreshListKey, setRefreshListKey] = useState(0); // Key to force list refresh

    const handleAddNewQuest = () => {
        setEditingQuest(null);
        onOpen();
    };

    const handleEditQuest = (quest: Quest) => {
        setEditingQuest(quest);
        onOpen();
    };

    const handleSaveComplete = () => {
        onClose();
        setEditingQuest(null);
        setRefreshListKey(prev => prev + 1); // Increment key to trigger list refresh
    };


    if (isDMLoading) {
        return <Box p={8} textAlign="center"><Text color="gray.300">Loading...</Text></Box>;
    }

     if (!currentUser || !isDM) {
        return (
            <Box p={8} textAlign="center">
                <Text color="gray.400">Access Denied. You must be logged in as a DM.</Text>
                <Button as={Link} href="/" colorScheme="brand" mt={4}>
                    Go Home
                </Button>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg="gray.900" p={{ base: 4, md: 8 }}>
            <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
                 {/* Breadcrumb */}
                <Breadcrumb separator={<ChevronRight size={14} />} color="gray.400">
                  <BreadcrumbItem>
                    <BreadcrumbLink as={Link} href="/" _hover={{ color: 'brand.400' }}>
                      <Home size={16} className="inline mr-1" /> Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {/* Add other breadcrumb items if needed */}
                  <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink color="brand.400">
                        <Book size={16} className="inline mr-1" /> Quest Management
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Breadcrumb>

                <HStack justifyContent="space-between">
                     <Heading size="lg" color="gray.100">Quest Management</Heading>
                     <Button leftIcon={<Plus />} colorScheme="brand" onClick={handleAddNewQuest}>
                        Create New Quest
                    </Button>
                 </HStack>

                <Tabs isLazy colorScheme="brand" variant="soft-rounded">
                    <TabList mb={4}>
                        <Tab><List className="mr-2"/>Quest List</Tab>
                        <Tab><Send className="mr-2"/>Assign Quests</Tab>
                        <Tab><Activity className="mr-2"/>Track Quests</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel p={0}>
                            {/* Quest List (Refreshes when key changes) */}
                             <DMQuestListPage key={refreshListKey} onEditQuest={handleEditQuest} />
                        </TabPanel>
                        <TabPanel p={0}>
                            <DMQuestAssignment />
                        </TabPanel>
                        <TabPanel p={0}>
                            <DMQuestTracker />
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                {/* Modal for Quest Editor */}
                <Modal isOpen={isOpen} onClose={onClose} size="2xl" closeOnOverlayClick={false}>
                    <ModalOverlay />
                    <ModalContent bg="gray.800">
                        <ModalCloseButton color="gray.400" />
                        <ModalBody p={0}>
                            {/* Using the properly typed DMQuestEditor component */}
                            <DMQuestEditor
                                questToEdit={editingQuest}
                                onSaveComplete={handleSaveComplete}
                                onCancel={onClose}
                            />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </VStack>
        </Box>
    );
};

export default DMQuestManagementPage;