'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Spinner, Text, VStack, useToast } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import GameApp from '@/components/Layout/GameApp';
import { CharacterProvider, useCharacter } from '@/context/CharacterContext';

// This component wraps the GameApp and handles character initialization
const GameInitializer = () => {
  const { currentUser } = useAuth();
  const { 
    resetCharacter, 
    deleteCharacter,
    setCharacterName,
    setCharacterLevel
  } = useCharacter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initializerRef = useRef(false);
  const newCharacterRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    async function validateCharacter() {
      // If no user is logged in, redirect to login
      if (!currentUser) {
        router.push('/');
        return;
      }

      const characterId = searchParams?.get('characterId') ?? null;
      const isNewCharacter = searchParams?.get('new') === 'true';

      // Force create a new character if requested
      if (isNewCharacter) {
        try {
          console.log("Force creating new character");
          
          // Delete any existing character data for this user first
          await deleteCharacter();
          
          // Then properly reset the character state
          resetCharacter();
          
          // Set some default values to ensure it's recognized as a new character
          setCharacterName('New Character');
          setCharacterLevel(1);
          
          newCharacterRef.current = true;
          
          toast({
            title: "New Character Created",
            description: "Start by selecting a race and class",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Error creating new character:', error);
          setLoadError('Failed to create new character. Please try again.');
          return;
        }
      }

      // Regular character loading
      if (!characterId) {
        // If no character ID but also not explicitly requesting a new character,
        // we still reset to default state
        resetCharacter();
        setIsLoading(false);
        return;
      }

      try {
        // Verify the character belongs to the current user
        const characterDoc = await getDoc(doc(db, 'characters', characterId));
        
        if (!characterDoc.exists()) {
          console.log("Character not found, initializing new character");
          resetCharacter();
          setIsLoading(false);
        } else {
          // Character exists, proceed to load
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Character validation error:', error);
        setLoadError('Error loading character. Please try again.');
        router.push('/character-manager');
      }
    }

    // Ensure we only run this once
    if (!initializerRef.current) {
      initializerRef.current = true;
      validateCharacter();
    }
  }, [currentUser, router, searchParams, resetCharacter, deleteCharacter, setCharacterName, setCharacterLevel, toast]);

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

  const characterId = searchParams?.get('characterId') || '';
  return <GameApp characterId={characterId} isNewCharacter={newCharacterRef.current} />;
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