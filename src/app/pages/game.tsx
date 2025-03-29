'use client';

import React, { useState, useEffect } from 'react';
import { Box, Spinner, Text, VStack, useToast } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useCharacter } from '@/context/CharacterContext'; // Import character context hook
import GameApp from '@/components/Layout/GameApp';
import { CharacterProvider } from '@/context/CharacterContext';

const GameInitializer = () => {
  const { currentUser } = useAuth();
  // We no longer call resetCharacter, setCharacterName, or setCharacterLevel here.
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function initializeCharacter() {
      if (!currentUser) {
        router.push('/');
        return;
      }

      // Get the query parameters:
      // If no characterId is provided, default to the user's UID (primary record)
      const providedCharacterId = searchParams.get('characterId');
      const characterId = providedCharacterId || currentUser.uid;
      const isNewCharacter = searchParams.get('new') === 'true';

      try {
        const characterDoc = await getDoc(doc(db, 'characters', characterId));
        if (!characterDoc.exists()) {
          console.error("Character not found");
          setLoadError('Character not found');
          router.push('/character-manager');
          return;
        }
        const data = characterDoc.data();
        if (data.userId !== currentUser.uid) {
          console.error("Character belongs to another user");
          setLoadError('Not authorized to access this character');
          router.push('/character-manager');
          return;
        }
        console.log(`Character validated: ${data.characterName || 'Unnamed'}`);
      } catch (error) {
        console.error('Error validating character:', error);
        setLoadError('Error loading character. Please try again.');
        router.push('/character-manager');
        return;
      }
      setIsLoading(false);
    }

    initializeCharacter();
  }, [currentUser, router, searchParams, toast]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <VStack spacing={4}>
          <Text color="red.500">{loadError}</Text>
        </VStack>
      </Box>
    );
  }

  // Use the characterId from the query (or default to user's UID)
  const characterId = searchParams.get('characterId') || currentUser!.uid;
  const isNewCharacter = searchParams.get('new') === 'true';

  return <GameApp 
    isNewCharacter={isNewCharacter} 
    characterId={characterId}
  />;
};

// Main Game Page component
export default function GamePage() {
  return (
    <Box minH="100vh" bg="gray.50">
      <CharacterProvider>
        <GameInitializer />
      </CharacterProvider>
    </Box>
  );
}
