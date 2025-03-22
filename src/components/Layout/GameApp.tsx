'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Input, 
  Text, 
  VStack, 
  Heading, 
  HStack, 
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import Link from 'next/link';
import TabLayout from './TabLayout';
import { Tab } from '../../types/tabs';
import { useCharacter } from '@/context/CharacterContext';
import { useAuth } from '@/context/AuthContext';
import CharacterHeader from './CharacterHeader';

// Import all components
import Stats from '../stats/Stats';
import Skills from '../stats/Skills';
import Traits from '../stats/Traits';
import Attacks from '../actions/Attacks';
import Abilities from '../actions/Abilities';
import Spells from '../actions/Spells';
import HotList from '../actions/HotList';  
import Weapons from '../equipment/Weapons';
import Armor from '../equipment/Armor';
import Utility from '../equipment/Utility';
import Character from '../character/Character';
import Inventory from '../inventory/Inventory';
import Arcana from '../arcana/Arcana';
import Loot from '../loot/Loot';
import Quests from '../quests/Quests';
import Notes from '../notes/Notes';

// Extend the GameApp props to include characterId
export interface GameAppProps {
  isNewCharacter?: boolean;
  characterId?: string;
}

const GameApp: React.FC<GameAppProps> = ({ 
  isNewCharacter = false, 
  characterId 
}) => {
  // State for main tabs and sub-tabs
  const [activeMainTab, setActiveMainTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  const toast = useToast();

  // Get auth functions and currentUser from AuthContext
  const { currentUser, login, signup, logout } = useAuth();

  // Get the deleteCharacter function from CharacterContext
  const { deleteCharacter } = useCharacter();

  // Show toast for new character creation
  useEffect(() => {
    if (isNewCharacter) {
      toast({
        title: "New Character Ready",
        description: "Start by setting your race, class, and stats on the Character tab",
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  }, [isNewCharacter, toast]);
  
  // Local state for authentication form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Define the main tabs
  const mainTabs: Tab[] = [
    {
      id: 'character',
      label: 'Character',
      content: <Character />
    },
    {
      id: 'stats',
      label: 'Stats',
      content: (
        <TabLayout
          tabs={[
            { id: 'stats', label: 'Stats', content: <Stats /> },
            { id: 'skills', label: 'Skills', content: <Skills /> },
            { id: 'traits', label: 'Traits', content: <Traits /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      content: (
        <TabLayout
          tabs={[
            { id: 'attacks', label: 'Attacks', content: <Attacks /> },
            { id: 'abilities', label: 'Abilities', content: <Abilities /> },
            { id: 'spells', label: 'Spells', content: <Spells /> },
            { id: 'hotlist', label: 'Hot List', content: <HotList /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'equipment',
      label: 'Equipment',
      content: (
        <TabLayout
          tabs={[
            { id: 'weapons', label: 'Weapons', content: <Weapons /> },
            { id: 'armor', label: 'Armor', content: <Armor /> },
            { id: 'utility', label: 'Utility', content: <Utility /> }
          ]}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />
      )
    },
    {
      id: 'inventory',
      label: 'Inventory',
      content: <Inventory />
    },
    {
      id: 'arcana',
      label: 'Arcana',
      content: <Arcana />
    },
    {
      id: 'loot',
      label: 'Loot',
      content: <Loot />
    },
    {
      id: 'quests',
      label: 'Quests',
      content: <Quests />
    },
    {
      id: 'notes',
      label: 'Notes',
      content: <Notes />
    }
  ];

  // Handler for the authentication form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setErrorMessage(error.message || 'Authentication failed');
    }
  };

  // If user is not authenticated, show the auth form
  if (!currentUser) {
    return (
      <Box
        minH="100vh"
        bg="bgAlt" // Use new semantic tokens
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          bg="gray.800" // Darker background for the card
          p={6}
          borderRadius="md"
          boxShadow="lg"
          width={{ base: '90%', md: '400px' }}
          borderWidth="1px"
          borderColor="gray.700"
        >
          <Heading size="md" mb={4} textAlign="center" color="brand.300">
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </Heading>
          {errorMessage && (
            <Text color="accent.400" mb={2}>
              {errorMessage}
            </Text>
          )}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                borderColor="gray.600"
                _hover={{ borderColor: 'brand.400' }}
                _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                borderColor="gray.600"
                _hover={{ borderColor: 'brand.400' }}
                _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
              />
              <Button colorScheme="brand" type="submit" width="full">
                {isLoginMode ? 'Login' : 'Create Account'}
              </Button>
            </VStack>
          </form>
          <Text mt={4} textAlign="center" color="gray.400">
            {isLoginMode ? 'Need an account?' : 'Already have an account?'}{' '}
            <Button
              variant="link"
              color="brand.300"
              onClick={() => setIsLoginMode(!isLoginMode)}
            >
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </Button>
          </Text>
        </Box>
      </Box>
    );
  }

  // If user is authenticated, display the full TTRPG interface
  return (
    <Box minH="100vh" p={{ base: 2, md: 4 }} bg="bg">
      <Box
        maxW="6xl"
        mx="auto"
        bg="bgAlt"
        borderRadius="lg"
        boxShadow="dark-lg"
        overflow="hidden"
        borderWidth="1px"
        borderColor="gray.700"
      >
        {/* Header with CharacterHeader and action buttons */}
        <Box p={{ base: 2, md: 4 }} borderBottom="1px" borderColor="gray.700">
          <CharacterHeader />
          <HStack spacing={2} mt={2}>
            <Button
              colorScheme="accent"
              size="sm"
              variant="outline"
              onClick={() => {
                logout();
              }}
            >
              Logout
            </Button>
            <Button
              colorScheme="accent"
              size="sm"
              variant="outline"
              onClick={async () => {
                if (
                  window.confirm(
                    'Are you sure you want to completely delete your character? This action cannot be undone.'
                  )
                ) {
                  try {
                    await deleteCharacter();
                    toast({
                      title: "Character Deleted",
                      description: "Your character has been deleted",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                  } catch (error) {
                    console.error('Delete character failed:', error);
                  }
                }
              }}
            >
              Delete Character
            </Button>
            <Link href="/character-manager" passHref>
              <Button colorScheme="teal" size="sm" variant="outline">
                Manage Characters
              </Button>
            </Link>
          </HStack>
        </Box>

        {/* Main Content */}
        <Box p={{ base: 2, md: 6 }}>
          <TabLayout
            tabs={mainTabs}
            activeTab={activeMainTab}
            onTabChange={(index) => {
              setActiveMainTab(index);
              setActiveSubTab(0);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GameApp;