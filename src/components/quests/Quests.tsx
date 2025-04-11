'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Spinner,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Progress,
  Divider,
  Center,
  Alert,
  AlertIcon,
  SimpleGrid,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useCharacter } from '@/context/CharacterContext';
import { useAuth } from '@/context/AuthContext';
// Import ReactMarkdown component
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Define our types - these match what the DM assigns
interface QuestObjective {
  id: string;
  description: string;
  completed?: boolean;
  isOptional?: boolean;
  targetCount?: number;
  currentCount?: number;
  type?: string;
}

interface QuestReward {
  experience?: number;
  gold?: number;
  items?: Array<{ id: string, name: string, quantity: number }>;
  other?: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  giver?: string;
  location?: string;
  requiredLevel?: number;
}

interface QuestAssignment {
  id: string;
  questId: string;
  characterId: string;
  playerId: string;
  assignedAt: Timestamp | number;
  status: 'active' | 'completed' | 'failed';
  objectiveProgress?: Record<string, number>;
}

// Combined type for an assignment with its quest details
interface QuestAssignmentDetail {
  assignment: QuestAssignment;
  quest: Quest;
  progress: number; // percentage of completion (0-100)
}

const Quests: React.FC = () => {
  // Access character context
  const { docId: characterId, addGold } = useCharacter();
  // Add this line to get currentUser from Auth context instead of Character context
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<QuestAssignmentDetail[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const toast = useToast();

  // Fetch assignments for the current character and merge in quest details
  const loadAssignments = async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Loading quests for character ID:", characterId);

      // Query the questAssignments collection for this character
      const assignmentsQuery = query(
        collection(db, 'questAssignments'),
        where('characterId', '==', characterId)
      );

      const assignmentSnapshot = await getDocs(assignmentsQuery);
      console.log(`Found ${assignmentSnapshot.docs.length} quest assignments`);

      if (assignmentSnapshot.empty) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      const assignmentData = assignmentSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as QuestAssignment[];

      // For each assignment, fetch quest details
      const detailPromises = assignmentData.map(async (assignment) => {
        try {
          const questRef = doc(db, 'quests', assignment.questId);
          const questSnap = await getDoc(questRef);

          if (questSnap.exists()) {
            const questData = questSnap.data() as Quest;

            // Calculate progress percentage
            let completedCount = 0;
            let totalCount = 0;

            if (questData.objectives && questData.objectives.length > 0) {
              totalCount = questData.objectives.length;

              // Check objective completion based on assignment's objectiveProgress
              if (assignment.objectiveProgress) {
                questData.objectives.forEach(obj => {
                  if (assignment.objectiveProgress && assignment.objectiveProgress[obj.id] === 1) {
                    completedCount++;
                  }
                });
              }
            }

            const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return {
              assignment,
              quest: { ...questData, id: questSnap.id },
              progress: progressPercentage
            };
          } else {
            console.warn(`Quest ${assignment.questId} not found`);
            return {
              assignment,
              quest: {
                id: assignment.questId,
                title: 'Unknown Quest',
                description: 'This quest information is no longer available.',
                objectives: [],
                rewards: {}
              },
              progress: 0
            };
          }
        } catch (error) {
          console.error(`Error fetching quest ${assignment.questId}:`, error);
          return {
            assignment,
            quest: {
              id: assignment.questId,
              title: 'Error Loading Quest',
              description: 'There was an error loading this quest.',
              objectives: [],
              rewards: {}
            },
            progress: 0
          };
        }
      });

      const details = await Promise.all(detailPromises);
      setAssignments(details);
    } catch (error) {
      console.error('Error loading quest assignments:', error);
      toast({
        title: "Error Loading Quests",
        description: "There was a problem loading your quests. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const toggleObjective = async (assignmentId: string, objectiveId: string) => {
    try {
      // Update the local state by toggling the value for this objective
      const updatedAssignments = assignments.map(assignmentDetail => {
        if (assignmentDetail.assignment.id === assignmentId) {
          const currentProgress = assignmentDetail.assignment.objectiveProgress || {};
          const currentStatus = currentProgress[objectiveId] === 1;
          const newStatus = currentStatus ? 0 : 1;
          // Update Firestore: this will modify only the nested field for the objective
          const assignmentRef = doc(db, 'questAssignments', assignmentId);
          updateDoc(assignmentRef, { [`objectiveProgress.${objectiveId}`]: newStatus });
          return {
            ...assignmentDetail,
            assignment: {
              ...assignmentDetail.assignment,
              objectiveProgress: { ...currentProgress, [objectiveId]: newStatus },
            }
          };
        }
        return assignmentDetail;
      });
      setAssignments(updatedAssignments);
    } catch (error) {
      console.error('Error toggling objective status:', error);
      toast({
        title: "Error",
        description: "Failed to update objective status.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [characterId]);


  // Handler to update a quest's status
  const updateQuestStatus = async (assignmentId: string, newStatus: 'active' | 'completed' | 'failed') => {
    setIsUpdating(true);
    try {
      const assignmentRef = doc(db, 'questAssignments', assignmentId);
      await updateDoc(assignmentRef, { status: newStatus });

      // Find the quest we're updating
      const updatedQuest = assignments.find(a => a.assignment.id === assignmentId);

      // If completing a quest with gold rewards, add the gold
      if (newStatus === 'completed' && updatedQuest?.quest?.rewards?.gold) {
        const goldAmount = updatedQuest.quest.rewards.gold;
        addGold(goldAmount, `Reward from quest: ${updatedQuest.quest.title}`);
      }

      // Update local state for UI
      setAssignments(prev =>
        prev.map(item =>
          item.assignment.id === assignmentId
            ? { ...item, assignment: { ...item.assignment, status: newStatus } }
            : item
        )
      );

      toast({
        title: `Quest ${newStatus === 'completed' ? 'Completed' : newStatus === 'failed' ? 'Failed' : 'Updated'}`,
        status: newStatus === 'completed' ? 'success' : newStatus === 'failed' ? 'error' : 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error(`Error updating quest status to ${newStatus}:`, error);
      toast({
        title: "Update Failed",
        description: "Could not update quest status. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format timestamp
  const formatDate = (timestamp: Timestamp | number | undefined) => {
    if (!timestamp) return 'Unknown date';

    const date = timestamp instanceof Timestamp
      ? new Date(timestamp.toMillis())
      : new Date(timestamp);

    return date.toLocaleDateString();
  };

  // Filter quests by status
  const activeQuests = assignments.filter(a => a.assignment.status === 'active');
  const completedQuests = assignments.filter(a => a.assignment.status === 'completed');
  const failedQuests = assignments.filter(a => a.assignment.status === 'failed');

  if (loading) {
    return (
      <Center h="300px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading your quests...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>My Quests</Heading>

      {assignments.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>You don't have any quests yet. The DM can assign quests to you.</Text>
        </Alert>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Active ({activeQuests.length})</Tab>
            <Tab>Completed ({completedQuests.length})</Tab>
            <Tab>Failed ({failedQuests.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Active Quests Panel */}
            <TabPanel>
              {activeQuests.length === 0 ? (
                <Text color="gray.500">No active quests.</Text>
              ) : (
                <QuestList
                  quests={activeQuests}
                  updateQuestStatus={updateQuestStatus}
                  isUpdating={isUpdating}
                  toggleObjective={toggleObjective}  // Pass the function down as a prop
                />
              )}
            </TabPanel>

            {/* Completed Quests Panel */}
            <TabPanel>
              {completedQuests.length === 0 ? (
                <Text color="gray.500">No completed quests.</Text>
              ) : (
                <QuestList
                quests={activeQuests} 
                updateQuestStatus={updateQuestStatus}
                isUpdating={isUpdating}
                toggleObjective={toggleObjective}
                />
              )}
            </TabPanel>

            {/* Failed Quests Panel */}
            <TabPanel>
              {failedQuests.length === 0 ? (
                <Text color="gray.500">No failed quests.</Text>
              ) : (
                <QuestList
                quests={activeQuests} 
                updateQuestStatus={updateQuestStatus}
                isUpdating={isUpdating}
                toggleObjective={toggleObjective}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

// Component for rendering a list of quests
interface QuestListProps {
  quests: QuestAssignmentDetail[];
  updateQuestStatus: (id: string, status: 'active' | 'completed' | 'failed') => Promise<void>;
  isUpdating: boolean;
  toggleObjective: (assignmentId: string, objectiveId: string) => Promise<void>; // New prop
}


const QuestList: React.FC<QuestListProps> = ({ quests, updateQuestStatus, isUpdating, toggleObjective }) => {
  return (
    <VStack spacing={4} align="stretch">
      {quests.map((questDetail) => (
        <Accordion key={questDetail.assignment.id} allowToggle>
          <AccordionItem border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
            <AccordionButton py={3} _expanded={{ bg: 'blue.50' }}>
              <Box flex="1" textAlign="left">
                <HStack justify="space-between">
                  <Text fontWeight="bold">{questDetail.quest.title}</Text>
                  <HStack spacing={2}>
                    <Badge colorScheme={
                      questDetail.assignment.status === 'active' ? 'blue' :
                        questDetail.assignment.status === 'completed' ? 'green' : 'red'
                    }>
                      {questDetail.assignment.status}
                    </Badge>
                    {questDetail.quest.requiredLevel && (
                      <Badge colorScheme="purple">Level {questDetail.quest.requiredLevel}+</Badge>
                    )}
                  </HStack>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>

            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={4}>
                {/* Quest Description with Markdown Support */}
                <Box className="quest-description">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>{questDetail.quest.description}</ReactMarkdown>
                </Box>

                {/* Quest Details */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {questDetail.quest.giver && (
                    <Box>
                      <Text fontWeight="semibold">Quest Giver:</Text>
                      <Text>{questDetail.quest.giver}</Text>
                    </Box>
                  )}
                  {questDetail.quest.location && (
                    <Box>
                      <Text fontWeight="semibold">Location:</Text>
                      <Text>{questDetail.quest.location}</Text>
                    </Box>
                  )}
                </SimpleGrid>

                {/* Assignment Date */}
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Assigned on: {formatDate(questDetail.assignment.assignedAt)}
                  </Text>
                </Box>

                {/* Progress Bar */}
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="semibold">Progress:</Text>
                    <Text>{questDetail.progress}%</Text>
                  </HStack>
                  <Progress
                    value={questDetail.progress}
                    colorScheme={
                      questDetail.assignment.status === 'active' ? 'blue' :
                        questDetail.assignment.status === 'completed' ? 'green' : 'red'
                    }
                    borderRadius="full"
                    hasStripe={questDetail.assignment.status === 'active'}
                  />
                </Box>

                {/* Objectives */}
                {questDetail.quest.objectives && questDetail.quest.objectives.length > 0 && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>Objectives:</Text>
                    <VStack align="start" spacing={2}>
                      {questDetail.quest.objectives.map((obj) => {
                        const isCompleted = questDetail.assignment.objectiveProgress?.[obj.id] === 1;

                        return (
                          <HStack key={obj.id} width="full" opacity={isCompleted ? 0.7 : 1}>
                            <Badge
                              cursor="pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevents collapsing the accordion
                                toggleObjective(questDetail.assignment.id, obj.id);
                              }}
                              colorScheme={isCompleted ? 'green' : 'gray'}
                              p={1}
                            >
                              {isCompleted ? '✓' : '○'}
                            </Badge>


                            <Box flex="1">
                              {/* Markdown support for objective descriptions */}
                              <div className={isCompleted ? 'completed-objective' : ''}>
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                  {obj.description}
                                </ReactMarkdown>
                              </div>
                            </Box>
                            {obj.isOptional && (
                              <Badge colorScheme="purple" variant="outline">Optional</Badge>
                            )}
                          </HStack>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

                {/* Rewards */}
                {questDetail.quest.rewards && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>Rewards:</Text>
                    <VStack align="start" spacing={1}>
                      {questDetail.quest.rewards.experience && (
                        <HStack>
                          <Badge colorScheme="purple">XP</Badge>
                          <Text>{questDetail.quest.rewards.experience} experience points</Text>
                        </HStack>
                      )}
                      {questDetail.quest.rewards.gold && (
                        <HStack>
                          <Badge colorScheme="yellow">Gold</Badge>
                          <Text>{questDetail.quest.rewards.gold} gold pieces</Text>
                        </HStack>
                      )}
                      {questDetail.quest.rewards.items && questDetail.quest.rewards.items.length > 0 && (
                        questDetail.quest.rewards.items.map((item, idx) => (
                          <HStack key={idx}>
                            <Badge colorScheme="blue">Item</Badge>
                            <Text>{item.name} x{item.quantity || 1}</Text>
                          </HStack>
                        ))
                      )}
                      {questDetail.quest.rewards.other && (
                        <HStack alignItems="flex-start">
                          <Badge colorScheme="gray">Other</Badge>
                          {/* Add markdown support for 'other' rewards too */}
                          <Box flex="1">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{questDetail.quest.rewards.other}</ReactMarkdown>
                          </Box>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Status Update Buttons */}
                {questDetail.assignment.status === 'active' && (
                  <HStack spacing={3} justifyContent="flex-end" pt={2}>
                    <Button
                      colorScheme="green"
                      onClick={() => updateQuestStatus(questDetail.assignment.id, 'completed')}
                      isLoading={isUpdating}
                      size="sm"
                    >
                      Mark as Completed
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={() => updateQuestStatus(questDetail.assignment.id, 'failed')}
                      isLoading={isUpdating}
                      size="sm"
                    >
                      Mark as Failed
                    </Button>
                  </HStack>
                )}

                {questDetail.assignment.status === 'completed' && (
                  <Button
                    colorScheme="blue"
                    onClick={() => updateQuestStatus(questDetail.assignment.id, 'active')}
                    isLoading={isUpdating}
                    size="sm"
                    alignSelf="flex-end"
                  >
                    Reactivate Quest
                  </Button>
                )}

                {questDetail.assignment.status === 'failed' && (
                  <Button
                    colorScheme="blue"
                    onClick={() => updateQuestStatus(questDetail.assignment.id, 'active')}
                    isLoading={isUpdating}
                    size="sm"
                    alignSelf="flex-end"
                  >
                    Try Again
                  </Button>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ))}
    </VStack>
  );
};

// Helper to format date (moved outside for cleaner code)
const formatDate = (timestamp: Timestamp | number | undefined) => {
  if (!timestamp) return 'Unknown date';

  const date = timestamp instanceof Timestamp
    ? new Date(timestamp.toMillis())
    : new Date(timestamp);

  return date.toLocaleDateString();
};

export default Quests;