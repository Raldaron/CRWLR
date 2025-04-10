import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Text,
    VStack,
    HStack,
    Badge,
    useToast,
} from '@chakra-ui/react';
import { Search, User, Mail } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Player {
    id: string;
    displayName: string;
    email: string;
    characterCount: number; // Added character count
}

interface DMPlayerListProps {
    onSelectPlayer: (playerId: string) => void;
    selectedPlayerId: string | null;
}

const DMPlayerList: React.FC<DMPlayerListProps> = ({ onSelectPlayer, selectedPlayerId }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    useEffect(() => {
        const loadPlayers = async () => {
            setIsLoading(true);
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                const playersList: Player[] = [];

                // Fetch character counts in parallel
                const characterCountPromises = usersSnapshot.docs.map(async (userDoc) => {
                    const userData = userDoc.data();
                    const charactersQuery = query(
                        collection(db, 'characters'),
                        where('userId', '==', userDoc.id),
                        limit(10) // Limit for performance, just need count
                    );
                    const charactersSnapshot = await getDocs(charactersQuery);
                    return {
                        id: userDoc.id,
                        displayName: userData.displayName || userData.email || 'Unknown Player',
                        email: userData.email || 'No Email',
                        characterCount: charactersSnapshot.size // Get the count directly
                    };
                });

                const results = await Promise.all(characterCountPromises);
                setPlayers(results);

            } catch (error) {
                console.error('Error loading players:', error);
                toast({
                    title: 'Error', description: 'Failed to load players', status: 'error',
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadPlayers();
    }, [toast]);

    const filteredPlayers = useMemo(() => {
        return players.filter(player =>
            player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, searchTerm]);

    if (isLoading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" color="brand.400" />
                <Text mt={4} color="gray.400">Loading Players...</Text>
            </Box>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            <InputGroup>
                <InputLeftElement pointerEvents="none">
                    <Search size={18} color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search players by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="gray.700" borderColor="gray.600"
                />
            </InputGroup>

            <ScrollArea className="h-[500px]">
                <VStack spacing={3} align="stretch">
                    {filteredPlayers.length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={5}>No players found.</Text>
                    ) : (
                        filteredPlayers.map(player => (
                            <Box
                                key={player.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                borderColor={selectedPlayerId === player.id ? "brand.500" : "gray.700"}
                                bg={selectedPlayerId === player.id ? "gray.750" : "gray.800"}
                                cursor="pointer"
                                onClick={() => onSelectPlayer(player.id)}
                                _hover={{ bg: 'gray.750' }}
                            >
                                <VStack align="start" spacing={1}>
                                    <HStack>
                                        <User size={16} color="gray.400"/>
                                        <Text fontWeight="bold" color="gray.200">{player.displayName}</Text>
                                    </HStack>
                                    <HStack>
                                         <Mail size={14} color="gray.500"/>
                                         <Text fontSize="sm" color="gray.400">{player.email}</Text>
                                    </HStack>
                                    <Badge colorScheme="purple">{player.characterCount} Character(s)</Badge>
                                </VStack>
                            </Box>
                        ))
                    )}
                </VStack>
            </ScrollArea>
        </VStack>
    );
};

export default DMPlayerList;