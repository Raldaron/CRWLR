// Updated character-manager.tsx
// This fixes the character listing and management

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, 
  VStack, 
  Text, 
  Button, 
  Heading, 
  SimpleGrid, 
  Card, 
  CardBody, 
  useToast,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Center,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { PlusCircle, LogOut } from 'lucide-react';

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

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return null;
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading>Character Manager</Heading>
          <Flex gap={4}>
            <Button 
              colorScheme="green" 
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
            <Spinner size="xl" />
          </Center>
        ) : characters.length === 0 ? (
          <Card variant="outline" p={6} textAlign="center">
            <VStack spacing={6}>
              <Text fontSize="lg">You don't have any characters yet.</Text>
              <Button 
                colorScheme="green" 
                size="lg" 
                onClick={handleCreateNewCharacter}
                leftIcon={<PlusCircle size={20} />}
                width="300px"
              >
                Create Your First Character
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {characters.map((character) => (
              <Card 
                key={character.id} 
                variant="elevated" 
                bg="white" 
                boxShadow="md"
                borderRadius="lg"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ 
                  transform: "translateY(-4px)", 
                  boxShadow: "lg"
                }}
              >
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" fontSize="xl">
                      {character.characterName || 'Unnamed Character'}
                    </Text>
                    <Text>
                      Level {character.characterLevel} 
                      {character.selectedRace ? ` ${character.selectedRace.name}` : ''}
                      {character.selectedClass ? ` ${character.selectedClass.name}` : ''}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Last Updated: {character.lastUpdated ? new Date(character.lastUpdated).toLocaleString() : 'Unknown'}
                    </Text>
                    <SimpleGrid columns={2} spacing={2}>
                      <Button 
                        colorScheme="blue" 
                        onClick={() => handleCharacterSelect(character)}
                      >
                        Select
                      </Button>
                      <Button 
                        colorScheme="red" 
                        variant="outline"
                        onClick={() => setCharacterToDelete(character)}
                      >
                        Delete
                      </Button>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
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
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Character
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete "{characterToDelete?.characterName}"? 
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setCharacterToDelete(null)}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteCharacter} ml={3}>
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