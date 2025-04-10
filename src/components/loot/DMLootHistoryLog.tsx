// components/admin/loot/DMLootHistoryLog.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Spinner,
    Text,
    VStack,
    HStack,
    Input,
    TableContainer,
    useToast,
    Alert,
    AlertIcon,
    Heading
} from '@chakra-ui/react';
import { collection, query, where, getDocs, orderBy, Timestamp, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, UserCheck, Clock } from 'lucide-react';

interface LootHistoryEntry {
    id: string;
    packageName: string;
    recipientId: string; // User ID of the player
    recipientName?: string; // Display name of the player (fetch needed)
    characterId?: string; // Optional: If sent to specific character
    characterName?: string; // Optional: Character name (fetch needed)
    distributedAt: number;
    itemCount: number;
    acknowledged: boolean;
    acknowledgedAt?: number;
}

const DMLootHistoryLog: React.FC = () => {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState<LootHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Add search later if needed
    const toast = useToast();

    useEffect(() => {
        const loadHistory = async () => {
            if (!currentUser) return;
            setIsLoading(true);

            try {
                const lootQuery = query(
                    collection(db, 'lootDistributions'),
                    where('distributedBy', '==', currentUser.uid), // Only show loot sent by this DM
                    orderBy('distributedAt', 'desc')
                );
                const lootSnapshot = await getDocs(lootQuery);

                // Fetch user/character details in parallel for efficiency
                const historyPromises = lootSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let recipientName = 'Unknown Player';
                    let characterName: string | undefined = undefined;

                    // Fetch recipient user data
                    try {
                        const userQuery = query(collection(db, 'users'), where('userId', '==', data.recipientId), limit(1));
                        const userSnap = await getDocs(userQuery);
                        if (!userSnap.empty) {
                            recipientName = userSnap.docs[0].data().displayName || userSnap.docs[0].data().email || recipientName;
                        }
                    } catch (userError) { console.error("Error fetching recipient name:", userError); }

                    // Fetch character data if ID exists
                    if (data.characterId) {
                        try {
                            const charRef = doc(db, 'characters', data.characterId);
                            const charSnap = await getDoc(charRef);
                            if (charSnap.exists()) {
                                characterName = charSnap.data().characterName || 'Unnamed Character';
                            }
                        } catch (charError) { console.error("Error fetching character name:", charError); }
                    }


                    return {
                        id: docSnap.id,
                        packageName: data.packageName || 'Unknown Package',
                        recipientId: data.recipientId,
                        recipientName,
                        characterId: data.characterId,
                        characterName,
                        distributedAt: data.distributedAt instanceof Timestamp ? data.distributedAt.toMillis() : data.distributedAt,
                        itemCount: Array.isArray(data.items) ? data.items.length : 0,
                        acknowledged: data.acknowledged || false,
                        acknowledgedAt: data.acknowledgedAt ? (data.acknowledgedAt instanceof Timestamp ? data.acknowledgedAt.toMillis() : data.acknowledgedAt) : undefined,
                    };
                });

                const resolvedHistory = await Promise.all(historyPromises);
                setHistory(resolvedHistory);

            } catch (error) {
                console.error("Error loading loot history:", error);
                toast({ title: 'Error', description: 'Could not fetch loot distribution history.', status: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [currentUser, toast]);

    const formatDate = (timestamp: number | undefined) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    if (isLoading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" color="brand.400" />
                <Text mt={4} color="gray.400">Loading Loot History...</Text>
            </Box>
        );
    }

    if (history.length === 0) {
         return (
            <Alert status="info" bg="gray.700" color="gray.200" borderRadius="md">
                <AlertIcon color="blue.300"/>
                You haven't distributed any loot boxes yet.
            </Alert>
        );
    }


    return (
        <VStack spacing={4} align="stretch">
            {/* Add Search/Filter Inputs here if needed */}
             <Heading size="md" color="gray.200">Loot Distribution History</Heading>
             <ScrollArea className="h-[600px]">
                <TableContainer>
                    <Table variant="simple" size="sm">
                        <Thead position="sticky" top={0} bg="gray.800" zIndex={1}>
                            <Tr>
                                <Th color="gray.400">Package Name</Th>
                                <Th color="gray.400">Recipient</Th>
                                <Th color="gray.400">Character</Th>
                                <Th color="gray.400">Items</Th>
                                <Th color="gray.400">Distributed At</Th>
                                <Th color="gray.400">Status</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {history.map(entry => (
                                <Tr key={entry.id} _hover={{ bg: 'gray.750' }}>
                                    <Td>
                                        <HStack><Package size={14} /><Text color="gray.200">{entry.packageName}</Text></HStack>
                                    </Td>
                                    <Td color="gray.300">{entry.recipientName}</Td>
                                    <Td color="gray.300">{entry.characterName || '-'}</Td>
                                    <Td><Badge colorScheme="blue">{entry.itemCount}</Badge></Td>
                                    <Td color="gray.400" fontSize="xs">{formatDate(entry.distributedAt)}</Td>
                                    <Td>
                                        {entry.acknowledged ? (
                                            <Badge colorScheme="green" variant="outline">
                                                <HStack spacing={1}><UserCheck size={12} /><span>Opened</span></HStack>
                                                <Text fontSize="xx-small" color="gray.500">{formatDate(entry.acknowledgedAt)}</Text>
                                            </Badge>
                                        ) : (
                                            <Badge colorScheme="yellow">
                                                 <HStack spacing={1}><Clock size={12} /><span>Pending</span></HStack>
                                            </Badge>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </ScrollArea>
        </VStack>
    );
};

export default DMLootHistoryLog;