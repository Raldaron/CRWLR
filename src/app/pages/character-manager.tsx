// Updated character-manager.tsx 
// This file handles character listing and management with dark theme styling

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, 
  VStack, 
  Text, 
  Button, 
  Heading, 
  SimpleGrid,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Center,
  Badge,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { PlusCircle, LogOut, Calendar, Star } from 'lucide-react';
import DarkThemedCard from '@/components/ui/DarkThemedCard';

// Simple character interface
interface Character {
  id: string;
  characterName: string;
  characterLevel: number;
  userId: string;
  selectedRace?: { name: string } | null;
  selectedClass?: { name: string } | null;
  createdAt?: number;
  lastUpdated?: number;
}

export default function CharacterManager() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null!);

  // Fetch characters from Firestore
  const fetchCharacters = async () => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    try {
      setIsLoading(true);
      
      // Query the characters collection for this user
      const q = query(
        collection(db, 'characters'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedCharacters: Character[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Character;
        fetchedCharacters.push({
          id: doc.id,
          userId: data.userId || currentUser.uid,
          characterName: data.characterName || 'Unnamed Character',
          characterLevel: data.characterLevel || 1,
          selectedRace: data.selectedRace,
          selectedClass: data.selectedClass,
          createdAt: data.createdAt || Date.now(),
          lastUpdated: data.lastUpdated || Date.now()
        });
      });

      // Sort by last updated date (newest first)
      fetchedCharacters.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      
      setCharacters(fetchedCharacters);
      
      if (fetchedCharacters.length === 0) {
        toast({
          title: 'No Characters',
          description: 'Create your first character to get started!',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      toast({
        title: 'Error',
        description: 'Could not load characters. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load characters when the component mounts
  useEffect(() => {
    if (currentUser) {
      fetchCharacters();
    } else {
      router.push('/');
    }
  }, [currentUser]);

  // Handle creating a new character
  const handleCreateNewCharacter = () => {
    router.push('/game?new=true');
  };

  // Handle selecting a character
  const handleCharacterSelect = (character: Character) => {
    router.push(`/game?characterId=${character.id}`);
  };

  // Handle deleting a character
  const handleDeleteCharacter = async () => {
    if (!characterToDelete || !currentUser) return;
  
    try {
      // Reference to the character document
      const characterRef = doc(db, 'characters', characterToDelete.id);
      
      // Delete the document
      await deleteDoc(characterRef);
      
      // Remove from local state
      setCharacters(characters.filter(c => c.id !== characterToDelete.id));
      
      toast({
        title: 'Character Deleted',
        description: `"${characterToDelete.characterName}" has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: 'Error',
        description: 'Could not delete character. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCharacterToDelete(null);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Logout failed. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return null;
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto" bg="gray.900" minH="100vh">
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading color="brand.300">Character Manager</Heading>
          <Flex gap={4}>
            <Button 
              colorScheme="brand" 
              size="lg" 
              onClick={handleCreateNewCharacter}
              leftIcon={<PlusCircle size={20} />}
            >
              Create New Character
            </Button>
            <Button
              colorScheme="gray"
              size="lg"
              onClick={handleLogout}
              leftIcon={<LogOut size={20} />}
            >
              Logout
            </Button>
          </Flex>
        </Flex>
        
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.400" />
          </Center>
        ) : characters.length === 0 ? (
          <DarkThemedCard borderColor="brand.700" p={6} textAlign="center">
            <VStack spacing={6}>
              <Text fontSize="lg" color="gray.300">You don't have any characters yet.</Text>
              <Button 
                colorScheme="brand" 
                size="lg" 
                onClick={handleCreateNewCharacter}
                leftIcon={<PlusCircle size={20} />}
                width="300px"
              >
                Create Your First Character
              </Button>
            </VStack>
          </DarkThemedCard>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {characters.map((character) => (
              <DarkThemedCard
                key={character.id}
                isSelected={false}
                borderColor="gray.700"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ 
                  transform: "translateY(-4px)", 
                  boxShadow: "lg"
                }}
              >
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold" fontSize="xl" color="gray.200">
                    {character.characterName || 'Unnamed Character'}
                  </Text>
                  
                  <HStack spacing={2}>
                    <Badge colorScheme="brand" px={2} py={1}>
                      Level {character.characterLevel}
                    </Badge>
                    
                    {character.selectedRace && (
                      <Badge colorScheme="teal" px={2} py={1}>
                        {character.selectedRace.name}
                      </Badge>
                    )}
                    
                    {character.selectedClass && (
                      <Badge colorScheme="purple" px={2} py={1}>
                        {character.selectedClass.name}
                      </Badge>
                    )}
                  </HStack>
                  
                  <HStack spacing={4} color="gray.400" fontSize="xs">
                    <Flex align="center" gap={1}>
                      <Calendar size={12} />
                      <Text>Updated: {formatDate(character.lastUpdated)}</Text>
                    </Flex>
                    
                    {character.selectedClass && (
                      <Flex align="center" gap={1}>
                        <Star size={12} />
                        <Text>{character.selectedClass.name}</Text>
                      </Flex>
                    )}
                  </HStack>
                  
                  <SimpleGrid columns={2} spacing={2}>
                    <Button 
                      colorScheme="brand" 
                      onClick={() => handleCharacterSelect(character)}
                    >
                      Select
                    </Button>
                    <Button 
                      colorScheme="accent" 
                      variant="outline"
                      onClick={() => setCharacterToDelete(character)}
                    >
                      Delete
                    </Button>
                  </SimpleGrid>
                </VStack>
              </DarkThemedCard>
            ))}
          </SimpleGrid>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={!!characterToDelete}
          leastDestructiveRef={cancelRef}
          onClose={() => setCharacterToDelete(null)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg="gray.800" borderColor="gray.700">
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.200">
                Delete Character
              </AlertDialogHeader>

              <AlertDialogBody color="gray.300">
                Are you sure you want to delete "{characterToDelete?.characterName}"? 
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setCharacterToDelete(null)} variant="ghost" color="gray.300">
                  Cancel
                </Button>
                <Button colorScheme="accent" onClick={handleDeleteCharacter} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
}