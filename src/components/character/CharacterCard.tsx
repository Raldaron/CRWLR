// CharacterCard.tsx - Compact character selection and level card
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  IconButton,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import RaceSelectionModals from './RaceSelectionModals';
import ClassSelectionModals from './ClassSelectionModals';

const CharacterCard: React.FC = () => {
  const { 
    selectedRace, 
    selectedClass, 
    characterLevel, 
    setCharacterLevel 
  } = useCharacter();

  // Handle level changes
  const handleLevelUp = () => {
    if (characterLevel < 20) {
      setCharacterLevel(characterLevel + 1);
    }
  };

  const handleLevelDown = () => {
    if (characterLevel > 1) {
      setCharacterLevel(characterLevel - 1);
    }
  };

  // Responsive layout
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      boxShadow="sm"
      overflow="hidden"
    >
      {/* Level display with controls */}
      <Flex 
        bg="blue.50" 
        p={3}
        borderTopRadius="lg"
        justifyContent="space-between"
        alignItems="center"
      >
        <HStack spacing={2}>
          <Text fontWeight="bold" fontSize="sm" color="blue.700">Level:</Text>
          <Badge 
            fontSize="lg" 
            colorScheme="blue" 
            borderRadius="full" 
            px={2}
          >
            {characterLevel}
          </Badge>
        </HStack>

        <HStack spacing={1}>
          <IconButton
            aria-label="Decrease level"
            icon={<ChevronDown size={16} />}
            size="xs"
            isDisabled={characterLevel <= 1}
            onClick={handleLevelDown}
            colorScheme="blue"
            variant="ghost"
          />
          <IconButton
            aria-label="Increase level"
            icon={<ChevronUp size={16} />}
            size="xs"
            isDisabled={characterLevel >= 20}
            onClick={handleLevelUp}
            colorScheme="blue"
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Race and class selection */}
      <Box p={4}>
        {isMobile ? (
          // Mobile layout (vertical)
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>Race</Text>
              <RaceSelectionModals />
            </Box>
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>Class</Text>
              <ClassSelectionModals />
            </Box>
          </VStack>
        ) : (
          // Desktop layout (horizontal)
          <HStack spacing={8}>
            <Box flex={1}>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>Race</Text>
              <RaceSelectionModals />
            </Box>
            <Box flex={1}>
              <Text fontWeight="semibold" fontSize="sm" mb={1}>Class</Text>
              <ClassSelectionModals />
            </Box>
          </HStack>
        )}

        {/* Current selections summary */}
        {(selectedRace || selectedClass) && (
          <Box mt={4} pt={2} borderTop="1px" borderColor="gray.100">
            <Text fontSize="xs" color="gray.500" mb={1}>Current Selection</Text>
            <Flex wrap="wrap" gap={2}>
              {selectedRace && (
                <Badge colorScheme="green" variant="subtle">
                  {selectedRace.name}
                </Badge>
              )}
              {selectedClass && (
                <Badge colorScheme="purple" variant="subtle">
                  {selectedClass.name}
                </Badge>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CharacterCard;