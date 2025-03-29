import React from 'react';
import { 
  Box, 
  Text, 
  Button, 
  HStack, 
  VStack,
  Badge,
  IconButton,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent } from '@/components/ui/card';

const CharacterLevel = () => {
  // Get all the character info from the game's context
  const { 
    selectedRace, 
    selectedClass,
    characterLevel = 1,  // Default to level 1
    setCharacterLevel,
    saveCharacterManually // Add this to get the save function
  } = useCharacter();

  // Function to handle leveling up
  const handleLevelUp = () => {
    if (characterLevel < 20) { // Maximum level is 20
      setCharacterLevel(characterLevel + 1);
      
      // Force a save after level change
      // The setTimeout ensures the level change is processed before saving
      setTimeout(() => {
        if (typeof saveCharacterManually === 'function') {
          saveCharacterManually();
        }
      }, 500);
    }
  };

  // Function to handle leveling down
  const handleLevelDown = () => {
    if (characterLevel > 1) { // Minimum level is 1
      setCharacterLevel(characterLevel - 1);
      
      // Force a save after level change
      setTimeout(() => {
        if (typeof saveCharacterManually === 'function') {
          saveCharacterManually();
        }
      }, 500);
    }
  };

  return (
    <Box 
      w="full" 
      mb={8} 
      bg="gray.800" 
      borderRadius="lg" 
      boxShadow="sm" 
      p={4}
      borderWidth="1px"
      borderColor="gray.700"
    >
      <VStack spacing={6} align="stretch">
        {/* Race and Class Display */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={2} color="gray.300">Character Details</Text>
          <HStack spacing={4}>
            <Text color="gray.300">Race: <Text as="span" color="brand.300" fontWeight="medium">{selectedRace?.name || 'Not Selected'}</Text></Text>
            <Text color="gray.300">Class: <Text as="span" color="purple.300" fontWeight="medium">{selectedClass?.name || 'Not Selected'}</Text></Text>
          </HStack>
        </Box>

        {/* Level Controls */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={2} color="gray.300">Character Level</Text>
          <HStack spacing={4} align="center">
            <Button
              size="sm"
              onClick={handleLevelDown}
              isDisabled={characterLevel <= 1}
              leftIcon={<ChevronDown className="h-4 w-4" />}
              colorScheme="brand"
              variant="outline"
            >
              Lower
            </Button>

            <Text fontSize="2xl" fontWeight="bold" mx={4} color="brand.300">
              Level {characterLevel}
            </Text>

            <Button
              size="sm"
              onClick={handleLevelUp}
              isDisabled={characterLevel >= 20}
              rightIcon={<ChevronUp className="h-4 w-4" />}
              colorScheme="brand"
            >
              Raise
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CharacterLevel;