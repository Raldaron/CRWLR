// src/components/admin/quests/DMQuestManager.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  HStack,
  useToast,
  VStack,
  Text,
} from '@chakra-ui/react';
import { Plus, List, Send, Activity, Book } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Import our extracted components
import DMQuestEditor from './DMQuestEditor';
import DMQuestAssignment from './DMQuestAssignment';
import DMQuestTracker from './DMQuestTracker';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// Define the Quest type for this component
interface Quest {
  id?: string;
  title: string;
  description: string;
  status: 'available' | 'active' | 'completed' | 'failed';
  objectives: any[];
  rewards: any;
  giver?: string;
  location?: string;
  requiredLevel?: number;
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
}

const DMQuestManager: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Modal for Quest Editor
  const { isOpen: isEditorOpen, onOpen: onEditorOpen, onClose: onEditorClose } = useDisclosure();
  
  // Fetch quests for the quest list
  const loadQuests = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const questsCollection = collection(db, 'quests');
      const questsSnapshot = await getDocs(query(questsCollection));
      
      const questsList = questsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Quest[];
      
      setQuests(questsList);
    } catch (error) {
      console.error('Error loading quests:', error);
      toast({ title: 'Error', description: 'Failed to load quests', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);
  
  // Initial data load
  useEffect(() => {
    loadQuests();
  }, [loadQuests]);
  
  // Handlers
  const handleCreateNewQuest = () => {
    setSelectedQuest(null); // Ensure we're creating new, not editing
    onEditorOpen();
  };
  
  const handleEditQuest = (quest: Quest) => {
    setSelectedQuest(quest);
    onEditorOpen();
  };
  
  const handleSaveComplete = () => {
    loadQuests(); // Refresh the quest list
    onEditorClose();
  };
  
  // If not logged in or not a DM
  if (!currentUser) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.400">You must be logged in to manage quests.</Text>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh" bg="gray.900" p={{ base: 3, md: 6 }}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        <HStack justifyContent="space-between" wrap="wrap" gap={3}>
          <Heading size="lg" color="gray.100" display="flex" alignItems="center">
            <Book className="mr-2" /> Quest Management
          </Heading>
          <Button 
            leftIcon={<Plus />} 
            colorScheme="brand" 
            onClick={handleCreateNewQuest}
          >
            Create New Quest
          </Button>
        </HStack>
        
        <Tabs 
          isLazy 
          colorScheme="brand" 
          variant="soft-rounded"
          index={activeTabIndex}
          onChange={setActiveTabIndex}
        >
          <TabList mb={4} overflowX="auto" py={2}>
            <Tab><List className="mr-2"/>Quest List</Tab>
            <Tab><Send className="mr-2"/>Assign Quests</Tab>
            <Tab><Activity className="mr-2"/>Track Quests</Tab>
          </TabList>
          
          <TabPanels>
            {/* Quest List Panel */}
            <TabPanel p={0}>
              {quests.length === 0 ? (
                <Box textAlign="center" p={8} bg="gray.800" borderRadius="md">
                  <Text color="gray.400" mb={4}>No quests have been created yet.</Text>
                  <Button 
                    colorScheme="brand" 
                    onClick={handleCreateNewQuest}
                    leftIcon={<Plus />}
                  >
                    Create Your First Quest
                  </Button>
                </Box>
              ) : (
                <Box 
                  p={{ base: 3, md: 5 }} 
                  bg="gray.800" 
                  borderRadius="md" 
                  borderWidth="1px" 
                  borderColor="gray.700"
                >
                  <Heading size="md" mb={4} color="gray.200">Quest List</Heading>
                  <VStack spacing={3} align="stretch">
                    {quests.map(quest => (
                      <Box 
                        key={quest.id} 
                        p={3} 
                        bg="gray.750" 
                        borderRadius="md" 
                        borderLeft="4px" 
                        borderColor={
                          quest.status === 'available' ? 'blue.500' :
                          quest.status === 'active' ? 'yellow.500' :
                          quest.status === 'completed' ? 'green.500' : 'red.500'
                        }
                        _hover={{ bg: 'gray.700' }}
                        cursor="pointer"
                        onClick={() => handleEditQuest(quest)}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" color="gray.200">{quest.title}</Text>
                            <Text fontSize="sm" color="gray.400" noOfLines={1}>
                              {quest.description || 'No description'}
                            </Text>
                          </VStack>
                          <HStack>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              colorScheme="blue" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTabIndex(1); // Switch to Assign tab
                                // Could also store selected quest for assignment here
                              }}
                            >
                              Assign
                            </Button>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              colorScheme="yellow"
                            >
                              Edit
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </TabPanel>
            
            {/* Quest Assignment Panel */}
            <TabPanel p={0}>
              <DMQuestAssignment />
            </TabPanel>
            
            {/* Quest Tracker Panel */}
            <TabPanel p={0}>
              <DMQuestTracker />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Modal for Quest Editor */}
        <Modal 
          isOpen={isEditorOpen} 
          onClose={onEditorClose} 
          size="2xl"
          closeOnOverlayClick={false}
        >
          <ModalOverlay />
          <ModalContent bg="gray.800" maxW={{ base: "95%", md: "800px" }}>
            <ModalCloseButton color="gray.400" />
            <ModalBody p={0}>
              <DMQuestEditor
                questToEdit={selectedQuest}
                onSaveComplete={handleSaveComplete}
                onCancel={onEditorClose}
                currentUserId={currentUser?.uid}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default DMQuestManager;