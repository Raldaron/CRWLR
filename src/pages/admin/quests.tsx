'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Spinner,
  Badge,
  useToast,
  IconButton,
  Center,
  Heading,
  Flex,
  Tooltip
} from '@chakra-ui/react';
import {
  Plus,
  Search,
  BookOpen,
  Trash,
  Edit
} from 'lucide-react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import debounce from 'lodash/debounce';

// Import updated Quest type from our shared types
import { Quest, QuestStatus } from '@/types/quest';

// Import quest management components
import DMQuestEditor from '@/components/admin/quests/DMQuestEditor';
import DMQuestAssignment from '@/components/admin/quests/DMQuestAssignment';
import DMQuestTracker from '@/components/admin/quests/DMQuestTracker';

// Utility function for badge colors based on quest status
const getStatusColorScheme = (status: QuestStatus): string => {
  switch (status) {
    case 'available': return 'blue';
    case 'active': return 'yellow';
    case 'completed': return 'green';
    case 'failed': return 'red';
    default: return 'gray';
  }
};

const QuestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  // Data States
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | ''>('');

  // States to control modals from extracted modules
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState<Quest | null>(null);

  const cancelRef = useRef<HTMLButtonElement>(null);

  // Data fetching for quests
  const loadQuests = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingQuests(false);
      setQuests([]);
      return;
    }
    setIsLoadingQuests(true);
    try {
      const questsCollection = collection(db, 'quests');
      const q = query(
        questsCollection,
        where("createdBy", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const questsSnapshot = await getDocs(q);
      const questsList = questsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'Untitled Quest',
          description: data.description || '',
          status: data.status || 'available',
          objectives: data.objectives || [],
          rewards: {
            ...(data.rewards || {}),
            items: data.rewards?.items || []
          },
          giver: data.giver || data.giverNPC || '',
          location: data.location || '',
          requiredLevel: data.requiredLevel || data.suggestedLevel || 1,
          createdBy: data.createdBy || currentUser.uid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Quest;
      });
      setQuests(questsList);
    } catch (error) {
      console.error('Error loading quests:', error);
      toast({ title: 'Error', description: 'Failed to load quests', status: 'error' });
    } finally {
      setIsLoadingQuests(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  // Filtering quests based on search term and status filter
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

  // Delete Quest
  const handleDeleteQuest = async () => {
    if (!questToDelete || !questToDelete.id) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'quests', questToDelete.id));
      setQuests(prev => prev.filter(q => q.id !== questToDelete.id));
      toast({ title: 'Quest Deleted', status: 'info' });
      setQuestToDelete(null);
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast({ title: 'Error Deleting Quest', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirmation = (quest: Quest) => {
    setQuestToDelete(quest);
  };

  // Handlers for opening the extracted modules as modals
  const openEditorModal = (quest?: Quest) => {
    setQuestToEdit(quest || null);
    setEditorModalOpen(true);
  };

  const closeEditorModal = () => {
    setEditorModalOpen(false);
    // Refresh quests after saving
    loadQuests();
  };

  // Render Functions for Quest List
  const renderQuestList = () => (
    <Box>
      <Table variant="simple" size="sm">
        <Thead position="sticky" top={0} bg="gray.800" zIndex={1}><Tr>
          <Th color="gray.300" width="40%" fontSize="xs" p={2}>TITLE</Th>
          <Th color="gray.300" width="10%" fontSize="xs" p={2}>STATUS</Th>
          <Th color="gray.300" width="5%" fontSize="xs" p={2} textAlign="center">LVL</Th>
          <Th color="gray.300" width="30%" fontSize="xs" p={2}>LOCATION</Th>
          <Th color="gray.300" width="15%" fontSize="xs" p={2} textAlign="right">ACTIONS</Th>
        </Tr></Thead>
        <Tbody>
          {filteredQuests.map(quest => (
            <Tr key={quest.id} _hover={{ bg: 'gray.750' }} height="8">
            <Td p={2}>
              <Tooltip label={quest.description} placement="top-start" bg="gray.600" color="white" hasArrow>
                <Text fontWeight="medium" noOfLines={1} color="gray.100" fontSize="xs">
                  {quest.title}
                </Text>
              </Tooltip>
            </Td>{/**/}
            <Td p={2}>
              <Badge colorScheme={getStatusColorScheme(quest.status)} fontSize="2xs" py={0} px={1} textTransform="uppercase">
                {quest.status}
              </Badge>
            </Td>{/**/}
            <Td p={2} textAlign="center" fontSize="xs">
              {quest.requiredLevel || '-'}
            </Td>{/**/}
            <Td p={2}>
              <Text noOfLines={1} fontSize="xs">
                {quest.location || '-'}
              </Text>
            </Td>{/**/}
            <Td p={2} textAlign="right">
              <HStack spacing={1} justify="flex-end">
                <IconButton aria-label="Edit Quest" icon={<Edit size={14} />} colorScheme="yellow" onClick={() => openEditorModal(quest)} size="xs" />
                <IconButton aria-label="Delete Quest" icon={<Trash size={14} />} colorScheme="red" onClick={() => openDeleteConfirmation(quest)} size="xs" />
              </HStack>
            </Td>
          </Tr>          
          ))}
        </Tbody>
      </Table>
      {filteredQuests.length === 0 && !isLoadingQuests && (
        <Center py={10}><Text color="gray.500">No quests found matching criteria.</Text></Center>
      )}
      {isLoadingQuests && (
        <Center py={10}><Spinner size="lg" color="brand.400" /></Center>
      )}
    </Box>
  );

  return (
    <Box p={{ base: 2, md: 4 }}>
      {/* Header with extra buttons to launch external modules */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "start", sm: "center" }}
        mb={4}
        gap={3}
      >
        <Heading
          size={{ base: "md", md: "lg" }}
          color="gray.100"
        >
          <BookOpen className="mr-2" /> Quest Management
        </Heading>

        <HStack spacing={3}>
          <Button
            leftIcon={<Plus />}
            colorScheme="brand"
            onClick={() => openEditorModal()}
            size={{ base: "sm", md: "md" }}
          >
            Create Quest
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => setAssignmentModalOpen(true)}
            size={{ base: "sm", md: "md" }}
          >
            Manage Assignments
          </Button>
          <Button
            colorScheme="teal"
            onClick={() => setTrackerModalOpen(true)}
            size={{ base: "sm", md: "md" }}
          >
            Quest Tracker
          </Button>
        </HStack>
      </Flex>

      {/* Search and Filter Controls */}
      <VStack spacing={4} mb={4} align="stretch">
        <HStack>
          <Input
            placeholder="Search quests..."
            onChange={handleSearchChange}
            bg="gray.700"
            borderColor="gray.600"
          />
          <Select
            placeholder="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value as QuestStatus | '')}
            value={statusFilter}
            bg="gray.700"
            borderColor="gray.600"
            maxW={{ base: "100%", sm: "200px" }}
          >
            <option value="available">Available</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </Select>
        </HStack>
      </VStack>

      {/* Quest List */}
      {renderQuestList()}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!questToDelete} onClose={() => setQuestToDelete(null)} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="gray.100">
          <ModalHeader>Delete Quest</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete "{questToDelete?.title}"? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setQuestToDelete(null)} ref={cancelRef}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteQuest} isLoading={isSubmitting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Quest Editor */}
      <Modal
        isOpen={editorModalOpen}
        onClose={closeEditorModal}
        size={{ base: "full", md: "3xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="gray.800" color="gray.100" borderRadius={{ base: 0, md: "md" }}>
          <ModalHeader>{questToEdit ? 'Edit Quest' : 'Create New Quest'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <DMQuestEditor
              questToEdit={questToEdit}
              onSaveComplete={closeEditorModal}
              onCancel={() => setEditorModalOpen(false)}
              currentUserId={currentUser?.uid}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal for Quest Assignment */}
      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        size={{ base: "full", md: "xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="gray.800" color="gray.100" borderRadius={{ base: 0, md: "md" }}>
          <ModalHeader>Assign Quest</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <DMQuestAssignment />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal for Quest Tracker */}
      <Modal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        size={{ base: "full", md: "xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="gray.800" color="gray.100" borderRadius={{ base: 0, md: "md" }}>
          <ModalHeader>Quest Tracker</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <DMQuestTracker />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuestsPage;