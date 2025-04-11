// src/components/admin/quests/DMQuestTracker.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Spinner,
  useToast,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  TableContainer,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Flex,
  IconButton,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Divider,
  Tooltip,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Edit,
  User,
  BookOpen,
  Award,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  Timestamp,
  limit,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import debounce from 'lodash/debounce';

// Interfaces
interface QuestObjective {
  id: string;
  description: string;
  completed?: boolean;
  type?: string;
  targetCount?: number;
  isOptional?: boolean;
}

interface Quest {
  id: string;
  title: string;
  description?: string;
  objectives?: QuestObjective[];
}

interface Character {
  id: string;
  characterName: string;
  userId: string;
  level?: number;
}

interface Player {
  id: string;
  displayName: string;
  email?: string;
}

interface QuestAssignment {
  id: string;
  questId: string;
  characterId: string;
  playerId: string;
  assignedAt: number | Timestamp;
  status: 'active' | 'completed' | 'failed';
  progress?: Record<string, number>;
  // Derived fields (not stored in DB)
  quest?: Quest;
  character?: Character;
  playerName?: string;
  progressPercentage?: number;
}

const DMQuestTracker: React.FC = () => {
  // State
  const [assignments, setAssignments] = useState<QuestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');
  const [questFilter, setQuestFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<QuestAssignment | null>(null);
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});

  // Modals
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isConfirmDeleteOpen, onOpen: onConfirmDeleteOpen, onClose: onConfirmDeleteClose } = useDisclosure();
  const { isOpen: isConfirmRemoveOpen, onOpen: onConfirmRemoveOpen, onClose: onConfirmRemoveClose } = useDisclosure();

  const toast = useToast();

  // Load assignments with related data
  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'questAssignments'),
        orderBy('assignedAt', 'desc')
      );

      // Apply server-side status filter if set
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }

      const snapshot = await getDocs(q);

      // Process assignments
      const assignmentPromises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const assignment: QuestAssignment = {
          id: docSnap.id,
          questId: data.questId || '',
          characterId: data.characterId || '',
          playerId: data.playerId || '',
          assignedAt: data.assignedAt || Timestamp.now(),
          status: data.status || 'active',
          progress: data.progress || {},
        };

        // Get quest data
        try {
          const questSnap = await getDoc(doc(db, 'quests', assignment.questId));
          if (questSnap.exists()) {
            assignment.quest = {
              id: questSnap.id,
              title: questSnap.data().title || 'Unknown Quest',
              description: questSnap.data().description || '',
              objectives: questSnap.data().objectives || [],
            };

            // Calculate progress percentage based on objectives
            if (assignment.quest.objectives && assignment.quest.objectives.length > 0) {
              const totalObjectives = assignment.quest.objectives.length;
              const completedObjectives = Object.values(assignment.progress || {}).filter(
                val => (typeof val === 'number' && val === 1) || (typeof val === 'boolean' && val === true)
              ).length;
              assignment.progressPercentage = Math.round((completedObjectives / totalObjectives) * 100);
            } else {
              assignment.progressPercentage = 0;
            }
          }
        } catch (error) {
          console.error(`Error fetching quest data for ${assignment.questId}:`, error);
        }

        // Get character data
        try {
          const charSnap = await getDoc(doc(db, 'characters', assignment.characterId));
          if (charSnap.exists()) {
            assignment.character = {
              id: charSnap.id,
              characterName: charSnap.data().characterName || 'Unknown Character',
              userId: charSnap.data().userId || '',
              level: charSnap.data().characterLevel || 1,
            };
          }
        } catch (error) {
          console.error(`Error fetching character data for ${assignment.characterId}:`, error);
        }

        // Get player name
        try {
          const userSnap = await getDoc(doc(db, 'users', assignment.playerId));
          if (userSnap.exists()) {
            assignment.playerName = userSnap.data().displayName || userSnap.data().email || 'Unknown Player';
          } else {
            assignment.playerName = 'Unknown Player';
          }
        } catch (error) {
          console.error(`Error fetching player data for ${assignment.playerId}:`, error);
          assignment.playerName = 'Unknown Player';
        }

        return assignment;
      });

      const loadedAssignments = await Promise.all(assignmentPromises);
      setAssignments(loadedAssignments);
    } catch (error) {
      console.error('Error loading quest assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quest assignments',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAssignments();
  }, [statusFilter]); // Re-fetch when status filter changes

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        (assignment.quest?.title.toLowerCase().includes(searchLower)) ||
        (assignment.character?.characterName.toLowerCase().includes(searchLower)) ||
        (assignment.playerName?.toLowerCase().includes(searchLower));

      // Player filter
      const matchesPlayer = !playerFilter || assignment.playerId === playerFilter;

      // Quest filter
      const matchesQuest = !questFilter || assignment.questId === questFilter;

      return matchesSearch && matchesPlayer && matchesQuest;
    });
  }, [assignments, searchTerm, playerFilter, questFilter]);

  // Unique players and quests for filters
  const uniquePlayers = useMemo(() => {
    const players = new Map<string, { id: string, name: string }>();
    assignments.forEach(a => {
      if (a.playerId && a.playerName && !players.has(a.playerId)) {
        players.set(a.playerId, { id: a.playerId, name: a.playerName });
      }
    });
    return Array.from(players.values());
  }, [assignments]);

  const uniqueQuests = useMemo(() => {
    const quests = new Map<string, { id: string, title: string }>();
    assignments.forEach(a => {
      if (a.questId && a.quest?.title && !quests.has(a.questId)) {
        quests.set(a.questId, { id: a.questId, title: a.quest.title });
      }
    });
    return Array.from(quests.values());
  }, [assignments]);

  // Debounced search
  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Update assignment status
  const updateAssignmentStatus = async (assignmentId: string, newStatus: 'active' | 'completed' | 'failed') => {
    if (!assignmentId) return;

    setIsUpdating(true);
    try {
      const assignmentRef = doc(db, 'questAssignments', assignmentId);
      await updateDoc(assignmentRef, { status: newStatus });

      // Update local state
      setAssignments(prev =>
        prev.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a)
      );

      toast({
        title: 'Status Updated',
        description: `Quest status changed to ${newStatus}`,
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update quest status',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete assignment (used for the delete confirmation modal)
  const deleteAssignment = async () => {
    if (!selectedAssignment?.id) {
      onConfirmDeleteClose();
      return;
    }

    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'questAssignments', selectedAssignment.id));

      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== selectedAssignment.id));

      toast({
        title: 'Assignment Deleted',
        status: 'success',
        duration: 2000,
      });

      onConfirmDeleteClose();
      if (isDetailOpen) onDetailClose();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete quest assignment',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // NEW FUNCTION: Remove quest assignment
  const removeQuestAssignment = async () => {
    if (!selectedAssignment?.id) {
      onConfirmRemoveClose();
      return;
    }

    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'questAssignments', selectedAssignment.id));

      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== selectedAssignment.id));

      toast({
        title: 'Quest Removed',
        description: `Quest removed from ${selectedAssignment.character?.characterName || 'character'}'s quest log.`,
        status: 'success',
        duration: 2000,
      });

      onConfirmRemoveClose();
      if (isDetailOpen) onDetailClose();
    } catch (error) {
      console.error('Error removing quest assignment:', error);
      toast({
        title: 'Removal Failed',
        description: 'Could not remove quest assignment',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle row expansion
  const toggleExpand = (assignmentId: string) => {
    setExpandedAssignments(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }));
  };

  // View assignment details
  const viewAssignmentDetails = (assignment: QuestAssignment) => {
    setSelectedAssignment(assignment);
    onDetailOpen();
  };

  // Open delete confirmation
  const confirmDelete = (assignment: QuestAssignment) => {
    setSelectedAssignment(assignment);
    onConfirmDeleteOpen();
  };

  // NEW FUNCTION: Open remove confirmation
  const confirmRemove = (assignment: QuestAssignment) => {
    setSelectedAssignment(assignment);
    onConfirmRemoveOpen();
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <Badge colorScheme="blue" display="flex" alignItems="center" gap={1}><Clock size={12} /> Active</Badge>;
      case 'completed':
        return <Badge colorScheme="green" display="flex" alignItems="center" gap={1}><CheckCircle size={12} /> Completed</Badge>;
      case 'failed':
        return <Badge colorScheme="red" display="flex" alignItems="center" gap={1}><XCircle size={12} /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Progress indicator component
  const ProgressIndicator = ({ assignment }: { assignment: QuestAssignment }) => {
    const percentage = assignment.progressPercentage || 0;
    const colorScheme =
      assignment.status === 'failed' ? 'red' :
        assignment.status === 'completed' ? 'green' : 'blue';

    return (
      <Box width="100%">
        <Progress
          value={percentage}
          size="sm"
          colorScheme={colorScheme}
          borderRadius="full"
          hasStripe={assignment.status === 'active'}
          isAnimated={assignment.status === 'active'}
          mb={1}
        />
        <Text fontSize="xs" color="gray.500">{percentage}%</Text>
      </Box>
    );
  };

  return (
    <Box p={{ base: 3, md: 5 }} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color="gray.200" display="flex" alignItems="center">
          <BookOpen size={18} className="mr-2" /> Quest Tracker
        </Heading>
        <Button
          leftIcon={<RefreshCw size={16} />}
          size="sm"
          colorScheme="blue"
          variant="ghost"
          onClick={() => loadAssignments()}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </HStack>

      {/* Filters */}
      <VStack spacing={3} mb={4}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} width="full">
          {/* Search */}
          <FormControl>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Search size={14} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search by quest, character, or player"
                onChange={handleSearchChange}
                bg="gray.700"
                borderColor="gray.600"
                pl={8}
              />
            </InputGroup>
          </FormControl>

          {/* Status Filter */}
          <FormControl>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Filter size={14} color="gray.500" />
              </InputLeftElement>
              <Select
                placeholder="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                bg="gray.700"
                borderColor="gray.600"
                pl={8}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </Select>
            </InputGroup>
          </FormControl>

          {/* Player Filter */}
          <FormControl>
            <Select
              placeholder="Filter by Player"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              bg="gray.700"
              borderColor="gray.600"
              size="sm"
            >
              <option value="">All Players</option>
              {uniquePlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        {/* Quest Filter - Second row */}
        <FormControl>
          <Select
            placeholder="Filter by Quest"
            value={questFilter}
            onChange={(e) => setQuestFilter(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            size="sm"
          >
            <option value="">All Quests</option>
            {uniqueQuests.map(quest => (
              <option key={quest.id} value={quest.id}>{quest.title}</option>
            ))}
          </Select>
        </FormControl>
      </VStack>

      {/* Main Content - Tracker Table */}
      {isLoading ? (
        <Center py={10}>
          <VStack spacing={3}>
            <Spinner size="xl" color="brand.400" />
            <Text color="gray.400">Loading quest assignments...</Text>
          </VStack>
        </Center>
      ) : filteredAssignments.length === 0 ? (
        <Center py={10}>
          <Alert status="info" variant="subtle" maxW="xl" borderRadius="md">
            <AlertIcon />
            <VStack align="start">
              <AlertTitle>No Assignments Found</AlertTitle>
              <Text>
                {searchTerm || statusFilter || playerFilter || questFilter
                  ? "No quest assignments match your current filters."
                  : "No quest assignments have been created yet."}
              </Text>
            </VStack>
          </Alert>
        </Center>
      ) : (
        <ScrollArea className="h-[600px]">
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                <Tr>
                  <Th color="gray.400" width="30%">Quest</Th>
                  <Th color="gray.400" width="25%">Character</Th>
                  <Th color="gray.400" width="20%">Status</Th>
                  <Th color="gray.400" width="15%">Progress</Th>
                  <Th color="gray.400" width="10%" textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAssignments.map(assignment => {
                  const mainRow = (
                    <Tr
                      key={`${assignment.id}-main`}
                      _hover={{ bg: 'gray.750' }}
                      cursor="pointer"
                      onClick={() => toggleExpand(assignment.id)}
                    >
                      <Td color="gray.200">
                        <Text fontWeight="medium">
                          {assignment.quest?.title || 'Unknown Quest'}
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          <Text color="gray.300">{assignment.character?.characterName || 'Unknown Character'}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Player: {assignment.playerName}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <StatusBadge status={assignment.status} />
                      </Td>
                      <Td>
                        <ProgressIndicator assignment={assignment} />
                      </Td>
                      <Td textAlign="right">
                        <HStack spacing={1} justify="flex-end">
                          <Tooltip label="View Details">
                            <IconButton
                              aria-label="View Details"
                              icon={<Info size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewAssignmentDetails(assignment);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label={expandedAssignments[assignment.id] ? "Collapse" : "Expand"}>
                            <IconButton
                              aria-label={expandedAssignments[assignment.id] ? "Collapse" : "Expand"}
                              icon={expandedAssignments[assignment.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              size="xs"
                              variant="ghost"
                              colorScheme="gray"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  );

                  const expandedRow = expandedAssignments[assignment.id] ? (
                    <Tr key={`${assignment.id}-expanded`}>
                      <Td colSpan={5} bg="gray.750" p={3}>
                        <VStack align="stretch" spacing={3}>
                          {/* ... expanded content like objectives ... */}
                        </VStack>
                      </Td>
                    </Tr>
                  ) : null;

                  return [mainRow, expandedRow];
                })}
              </Tbody>

            </Table>
          </TableContainer>
        </ScrollArea>
      )}

      {/* Assignment Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="gray.100">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
            {selectedAssignment?.quest?.title || 'Quest Details'}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            {selectedAssignment && (
              <VStack spacing={4} align="stretch">
                {/* Quest Info */}
                <Box>
                  <Heading size="sm" mb={2} color="gray.300">Quest Information</Heading>
                  <Text fontWeight="medium" color="gray.200">{selectedAssignment.quest?.title}</Text>
                  <Text fontSize="sm" color="gray.400" mt={1}>
                    {selectedAssignment.quest?.description || 'No description available.'}
                  </Text>
                </Box>

                <Divider borderColor="gray.700" />

                {/* Assignment Info */}
                <Box>
                  <Heading size="sm" mb={2} color="gray.300">Assignment Information</Heading>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <StatusBadge status={selectedAssignment.status} />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Assigned Date</Text>
                      <Text fontSize="sm" color="gray.300">
                        {selectedAssignment.assignedAt instanceof Timestamp
                          ? new Date(selectedAssignment.assignedAt.toMillis()).toLocaleString()
                          : new Date(selectedAssignment.assignedAt).toLocaleString()}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Character</Text>
                      <Text fontSize="sm" color="gray.300">
                        {selectedAssignment.character?.characterName || 'Unknown Character'}
                        {selectedAssignment.character?.level && ` (Level ${selectedAssignment.character.level})`}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Player</Text>
                      <Text fontSize="sm" color="gray.300">{selectedAssignment.playerName || 'Unknown Player'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Progress</Text>
                      <ProgressIndicator assignment={selectedAssignment} />
                    </Box>
                  </SimpleGrid>
                </Box>

                <Divider borderColor="gray.700" />

                {/* Objectives */}
                {selectedAssignment.quest?.objectives && selectedAssignment.quest.objectives.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2} color="gray.300">Objectives</Heading>
                    <VStack align="stretch" spacing={2}>
                      {selectedAssignment.quest.objectives.map((objective) => {
                        const isCompleted = selectedAssignment.progress?.[objective.id] === 1;
                        return (
                          <HStack key={objective.id} p={2} bg="gray.750" borderRadius="md" borderLeft="3px solid" borderLeftColor={isCompleted ? 'green.500' : 'gray.600'}>
                            <CheckCircle size={16} color={isCompleted ? 'green' : 'gray'} />
                            <Text fontSize="sm" color={isCompleted ? 'gray.300' : 'gray.400'} flex="1">
                              {objective.description}
                            </Text>
                            {objective.isOptional && (
                              <Badge colorScheme="purple" variant="outline">Optional</Badge>
                            )}
                          </HStack>
                        );
                      })}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <HStack spacing={3}>
              {/* Status update buttons */}
              {selectedAssignment && selectedAssignment.status !== 'completed' && (
                <Button
                  colorScheme="green"
                  size="sm"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => {
                    updateAssignmentStatus(selectedAssignment.id, 'completed');
                    onDetailClose();
                  }}
                  isDisabled={isUpdating}
                >
                  Mark Completed
                </Button>
              )}

              {selectedAssignment && selectedAssignment.status !== 'failed' && (
                <Button
                  colorScheme="red"
                  size="sm"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => {
                    updateAssignmentStatus(selectedAssignment.id, 'failed');
                    onDetailClose();
                  }}
                  isDisabled={isUpdating}
                >
                  Mark Failed
                </Button>
              )}

              {selectedAssignment && selectedAssignment.status !== 'active' && (
                <Button
                  colorScheme="blue"
                  size="sm"
                  leftIcon={<Clock size={14} />}
                  onClick={() => {
                    updateAssignmentStatus(selectedAssignment.id, 'active');
                    onDetailClose();
                  }}
                  isDisabled={isUpdating}
                >
                  Reactivate
                </Button>
              )}

              {/* NEW: Remove button in modal */}
              {selectedAssignment && (
                <Button
                  colorScheme="red"
                  size="sm"
                  leftIcon={<Trash size={14} />}
                  onClick={() => {
                    onDetailClose();
                    confirmRemove(selectedAssignment);
                  }}
                  isDisabled={isUpdating}
                >
                  Remove from Character
                </Button>
              )}

              <Button variant="ghost" onClick={onDetailClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isConfirmDeleteOpen} onClose={onConfirmDeleteClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="gray.100">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
            Confirm Deletion
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={3} align="stretch">
              <Box display="flex" justifyContent="center">
                <AlertTriangle size={24} color="var(--chakra-colors-red-400)" />
              </Box>
              <Text textAlign="center">
                Are you sure you want to delete this quest assignment?
              </Text>
              {selectedAssignment && (
                <Box bg="gray.750" p={3} borderRadius="md">
                  <Text fontWeight="medium" fontSize="sm">
                    Quest: {selectedAssignment.quest?.title || 'Unknown Quest'}
                  </Text>
                  <Text fontSize="sm">
                    Character: {selectedAssignment.character?.characterName || 'Unknown Character'}
                  </Text>
                </Box>
              )}
              <Text fontSize="sm" color="gray.400" textAlign="center">
                This action cannot be undone.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <Button
              variant="ghost"
              mr={3}
              onClick={onConfirmDeleteClose}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={deleteAssignment}
              isLoading={isUpdating}
              loadingText="Deleting..."
              size="sm"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* NEW: Remove Quest Confirmation Modal */}
      <Modal isOpen={isConfirmRemoveOpen} onClose={onConfirmRemoveClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="gray.100">
          <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
            Remove Quest from Character
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={3} align="stretch">
              <Box display="flex" justifyContent="center">
                <AlertTriangle size={24} color="var(--chakra-colors-yellow-400)" />
              </Box>
              <Text textAlign="center">
                Are you sure you want to remove this quest from the character's quest log?
              </Text>
              {selectedAssignment && (
                <Box bg="gray.750" p={3} borderRadius="md">
                  <Text fontWeight="medium" fontSize="sm">
                    Quest: {selectedAssignment.quest?.title || 'Unknown Quest'}
                  </Text>
                  <Text fontSize="sm">
                    Character: {selectedAssignment.character?.characterName || 'Unknown Character'}
                  </Text>
                  <Text fontSize="xs" mt={2} color="gray.400">
                    This will remove the quest from the character's quest log, but won't delete the quest itself.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="gray.700">
            <Button
              variant="ghost"
              mr={3}
              onClick={onConfirmRemoveClose}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              colorScheme="yellow"
              onClick={removeQuestAssignment}
              isLoading={isUpdating}
              loadingText="Removing..."
              size="sm"
            >
              Remove Quest
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DMQuestTracker;