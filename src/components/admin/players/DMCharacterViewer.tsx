// components/admin/players/DMCharacterViewer.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Spinner, Text, VStack, Heading, SimpleGrid, Badge, Divider, Alert, AlertIcon, HStack
} from '@chakra-ui/react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { UserCircle, ShieldCheck, Swords, Star } from 'lucide-react'; // Example icons

// Basic Character interface for display
interface CharacterData {
    id: string;
    characterName?: string;
    level?: number;
    raceName?: string;
    className?: string;
    // Add other key fields you want to display (stats, hp, etc.)
    currentHp?: number;
    maxHp?: number;
    currentMp?: number;
    maxMp?: number;
    baseStats?: Record<string, number>;
    // Add more fields as needed
}

interface DMCharacterViewerProps {
    selectedPlayerId: string | null;
}

const DMCharacterViewer: React.FC<DMCharacterViewerProps> = ({ selectedPlayerId }) => {
    const [characters, setCharacters] = useState<CharacterData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCharacters = async () => {
            if (!selectedPlayerId) {
                setCharacters([]);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);
            setCharacters([]); // Clear previous characters

            try {
                const charactersQuery = query(
                    collection(db, 'characters'),
                    where('userId', '==', selectedPlayerId)
                );
                const charactersSnapshot = await getDocs(charactersQuery);

                if (charactersSnapshot.empty) {
                    setError("No characters found for this player.");
                    setCharacters([]);
                } else {
                    const charsData = charactersSnapshot.docs.map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data(), // Spread all data
                    } as CharacterData)); // Cast to expected type
                    setCharacters(charsData);
                }
            } catch (err) {
                console.error('Error loading characters:', err);
                setError('Failed to load character data.');
                setCharacters([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadCharacters();
    }, [selectedPlayerId]);

    if (!selectedPlayerId) {
        return (
            <Box p={6} textAlign="center" bg="gray.800" borderRadius="md">
                <Text color="gray.400">Select a player to view their characters.</Text>
            </Box>
        );
    }

    if (isLoading) {
        return (
             <Box p={6} textAlign="center" bg="gray.800" borderRadius="md">
                <Spinner size="lg" color="brand.400" />
                <Text mt={3} color="gray.400">Loading characters...</Text>
            </Box>
        );
    }

     if (error) {
        return (
            <Alert status="error" bg="red.900" color="red.100" borderRadius="md">
                <AlertIcon color="red.300"/>
                {error}
            </Alert>
        );
    }

    if (characters.length === 0) {
         return (
            <Alert status="info" bg="blue.900" color="blue.100" borderRadius="md">
                <AlertIcon color="blue.300"/>
                This player currently has no characters.
            </Alert>
        );
    }


    return (
        <VStack spacing={4} align="stretch">
            <Heading size="md" color="gray.200">Player Characters</Heading>
            {characters.map(char => (
                <Box key={char.id} p={4} borderWidth="1px" borderRadius="md" borderColor="gray.700" bg="gray.800">
                    <VStack align="stretch" spacing={3}>
                        <HStack justifyContent="space-between">
                             <Heading size="sm" color="brand.300">{char.characterName || 'Unnamed Character'}</Heading>
                             <Badge>Level {char.level || 1}</Badge>
                        </HStack>
                         <HStack spacing={4}>
                            <Text fontSize="sm" color="gray.400">Race: {char.raceName || 'N/A'}</Text>
                            <Text fontSize="sm" color="gray.400">Class: {char.className || 'N/A'}</Text>
                        </HStack>
                         <Divider borderColor="gray.600"/>
                        {/* Add more details as needed */}
                        <SimpleGrid columns={3} spacing={4}>
                            <HStack><ShieldCheck size={16} color="green.400"/><Text fontSize="sm" color="gray.300">HP: {char.currentHp ?? 'N/A'} / {char.maxHp ?? 'N/A'}</Text></HStack>
                            <HStack><Star size={16} color="purple.400"/><Text fontSize="sm" color="gray.300">MP: {char.currentMp ?? 'N/A'} / {char.maxMp ?? 'N/A'}</Text></HStack>
                            {/* Example Stat */}
                             {char.baseStats?.strength && <HStack><Swords size={16} color="red.400"/><Text fontSize="sm" color="gray.300">Str: {char.baseStats.strength}</Text></HStack>}
                        </SimpleGrid>
                         {/* TODO: Add button/link to view full character sheet (potentially read-only) */}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
};

export default DMCharacterViewer;