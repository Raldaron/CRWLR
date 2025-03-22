'use client';

import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCharactersForUser, deleteCharacterById } from '@/context/CharacterContext';
import { PlusCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface Character {
  id: string;
  characterName: string;
  characterLevel: number;
  userId?: string;
  selectedRace?: { name: string };
  selectedClass?: { name: string };
}

// Define the user type to include the uid property
interface User {
  uid: string;
  email?: string;
  // Add other properties as needed
}

export default function CharacterManagerPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null!)

  // Comprehensive character fetching method
  const fetchCharacters = async () => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    try {
      console.log('Fetching characters for User ID:', (currentUser as User).uid);

      // Method 1: Query characters collection
      const charactersRef = collection(db, 'characters');
      const q = query(charactersRef, where('userId', '==', (currentUser as User).uid));
      const querySnapshot = await getDocs(q);

      console.log('Query Snapshot Size:', querySnapshot.size);

      const fetchedCharacters: Character[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Character Document:', {
          id: doc.id,
          name: data.characterName,
          level: data.characterLevel,
          userId: data.userId
        });

        fetchedCharacters.push({
          id: doc.id,
          characterName: data.characterName || 'Unnamed Character',
          characterLevel: data.characterLevel || 1,
          userId: data.userId,
          selectedRace: data.selectedRace,
          selectedClass: data.selectedClass
        });
      });

      // Method 2: Direct document fetch as fallback
      if (fetchedCharacters.length === 0) {
        console.log('No characters found by query, attempting direct fetch');
        const directCharacter = await getAllCharactersForUser((currentUser as User).uid);
        fetchedCharacters.push(...directCharacter);
      }

      console.log('Final Fetched Characters:', fetchedCharacters);
      
      setCharacters(fetchedCharacters);
      setIsLoading(false);

      if (fetchedCharacters.length === 0) {
        toast({
          title: 'No Characters',
          description: 'No characters found. Create your first character!',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Full error details:', error);
      toast({
        title: 'Error',
        description: 'Could not load characters. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [currentUser, router, toast]);

  const handleCreateNewCharacter = () => {
    router.push('/game?new=true');
  };

  const handleDeleteCharacter = async () => {
    if (!characterToDelete || !currentUser) return;
  
    try {
      const success = await deleteCharacterById((currentUser as User).uid, characterToDelete.id);
      
      if (success) {
        // Remove the deleted character from the list
        setCharacters(prev => prev.filter(c => c.id !== characterToDelete.id));
        
        toast({
          title: 'Character Deleted',
          description: `${characterToDelete.characterName} has been deleted.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
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
  
  const handleCharacterSelect = (character: Character) => {
    router.push(`/game?characterId=${character.id}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading>Character Manager</Heading>
          <Button 
            colorScheme="green" 
            size="lg" 
            onClick={handleCreateNewCharacter}
            leftIcon={<PlusCircle size={20} />}
          >
            Create New Character
          </Button>
        </Flex>
        
        {isLoading ? (
          <Spinner size="xl" alignSelf="center" />
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
              >
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" fontSize="xl">
                      {character.characterName || 'Unnamed Character'}
                    </Text>
                    <Text>
                      Level {character.characterLevel} 
                      {character.selectedRace && ` ${character.selectedRace.name}`}
                      {character.selectedClass && ` ${character.selectedClass.name}`}
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
                Are you sure you want to delete {characterToDelete?.characterName}? 
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