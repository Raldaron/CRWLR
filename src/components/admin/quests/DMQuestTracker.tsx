// components/admin/quests/DMQuestTracker.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, VStack, HStack, Select, Button, Spinner, useToast, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, Progress, TableContainer
} from '@chakra-ui/react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';

// Reuse interfaces or define locally if needed
interface Quest { id: string; title: string; objectives?: any[] } // Simplified
interface Player { id: string; displayName: string; email?: string; }
interface Character { id: string; characterName: string; userId?: string; }
interface QuestAssignment {
    id: string;
    questId: string;
    characterId: string;
    playerId: string;
    assignedAt: number;
    status: 'active' | 'completed' | 'failed';
    progress: Record<string, number>; // e.g., { objectiveId: count }
    questTitle?: string;
    characterName?: string;
    playerName?: string;
    objectiveCount?: number; // Total objectives for the quest
    completedObjectives?: number; // Calculated completed objectives
}

const DMQuestTracker: React.FC = () => {
    const [assignments, setAssignments] = useState<QuestAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(''); // '', 'active', 'completed', 'failed'
    const toast = useToast();

    useEffect(() => {
        const loadAssignments = async () => {
            setIsLoading(true);
            try {
                let q = query(collection(db, 'questAssignments'), orderBy('assignedAt', 'desc'));
                if (filterStatus) {
                    q = query(q, where('status', '==', filterStatus));
                }

                const snapshot = await getDocs(q);
                const assignmentPromises = snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let questTitle = 'Unknown Quest';
                    let characterName = 'Unknown Character';
                    let playerName = 'Unknown Player';
                    let objectiveCount = 0;
                    let completedObjectives = 0;

                    // Fetch Quest Title & Objective Count
                    try {
                        const questRef = doc(db, 'quests', data.questId);
                        const questSnap = await getDoc(questRef);
                        if (questSnap.exists()) {
                            const questData = questSnap.data();
                            questTitle = questData.title || questTitle;
                            objectiveCount = Array.isArray(questData.objectives) ? questData.objectives.length : 0;
                             // Calculate completed objectives (simplified: count entries in progress object)
                             // A more accurate calculation would check against objective requirements if they exist
                            completedObjectives = data.progress ? Object.keys(data.progress).length : 0;
                        }
                    } catch (e) { console.error("Error fetching quest details", e); }

                    // Fetch Character Name
                     try {
                        const charRef = doc(db, 'characters', data.characterId);
                        const charSnap = await getDoc(charRef);
                        if (charSnap.exists()) characterName = charSnap.data()?.characterName || characterName;
                    } catch (e) { console.error("Error fetching character name", e); }

                    // Fetch Player Name
                     try {
                        const userQuery = query(collection(db, 'users'), where('userId', '==', data.playerId), limit(1));
                        const userSnap = await getDocs(userQuery);
                        if (!userSnap.empty) playerName = userSnap.docs[0].data()?.displayName || playerName;
                    } catch (e) { console.error("Error fetching player name", e); }


                    return {
                        id: docSnap.id,
                        ...data,
                        assignedAt: data.assignedAt instanceof Timestamp ? data.assignedAt.toMillis() : data.assignedAt,
                        questTitle,
                        characterName,
                        playerName,
                        objectiveCount,
                        completedObjectives,
                    } as QuestAssignment;
                });

                const resolvedAssignments = await Promise.all(assignmentPromises);
                setAssignments(resolvedAssignments);

            } catch (error) {
                console.error("Error loading quest assignments:", error);
                toast({ title: 'Error', description: 'Could not load quest tracker data.', status: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadAssignments();
    }, [toast, filterStatus]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge colorScheme="blue"><HStack><Clock size={12}/><span>Active</span></HStack></Badge>;
            case 'completed': return <Badge colorScheme="green"><HStack><CheckCircle size={12}/><span>Completed</span></HStack></Badge>;
            case 'failed': return <Badge colorScheme="red"><HStack><XCircle size={12}/><span>Failed</span></HStack></Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

     const calculateProgress = (assignment: QuestAssignment): number => {
        if (assignment.status === 'completed') return 100;
        if (!assignment.objectiveCount || assignment.objectiveCount === 0) return 0;
        const completed = assignment.completedObjectives || 0;
        return Math.round((completed / assignment.objectiveCount) * 100);
    };


    return (
         <Box p={5} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
            <HStack justify="space-between" mb={4}>
                <Heading size="md" color="gray.200">Quest Tracker</Heading>
                 <Select
                    placeholder="Filter by Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    bg="gray.700" borderColor="gray.600" maxWidth="200px"
                    size="sm"
                >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </Select>
            </HStack>
            {isLoading ? (
                <Spinner color="brand.400"/>
            ) : (
                <ScrollArea className="h-[500px]">
                    <TableContainer>
                        <Table variant="simple" size="sm">
                             <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                                <Tr>
                                    <Th color="gray.400">Quest</Th>
                                    <Th color="gray.400">Character</Th>
                                    <Th color="gray.400">Player</Th>
                                    <Th color="gray.400">Status</Th>
                                    <Th color="gray.400">Progress</Th>
                                    <Th color="gray.400">Assigned At</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {assignments.length === 0 ? (
                                     <Tr><Td colSpan={6} textAlign="center" color="gray.500">No quest assignments found.</Td></Tr>
                                ) : (
                                    assignments.map(a => (
                                        <Tr key={a.id} _hover={{ bg: 'gray.750' }}>
                                            <Td color="gray.200">{a.questTitle}</Td>
                                            <Td color="gray.300">{a.characterName}</Td>
                                            <Td color="gray.400">{a.playerName}</Td>
                                            <Td>{getStatusBadge(a.status)}</Td>
                                            <Td>
                                                 <Progress
                                                    value={calculateProgress(a)}
                                                    size="sm"
                                                    colorScheme={a.status === 'failed' ? 'red' : a.status === 'completed' ? 'green' : 'blue'}
                                                    borderRadius="md"
                                                    hasStripe={a.status === 'active'}
                                                    isAnimated={a.status === 'active'}
                                                 />
                                                <Text fontSize="xs" color="gray.500">{calculateProgress(a)}%</Text>
                                            </Td>
                                            <Td color="gray.500" fontSize="xs">{new Date(a.assignedAt).toLocaleDateString()}</Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </ScrollArea>
            )}
        </Box>
    );
};

export default DMQuestTracker;