import React from 'react';
import { Box, VStack, Text, Badge, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';
import CharacterLevel from './CharacterLevel';
import RaceSelectionModals from './RaceSelectionModals';
import ClassSelectionModals from './ClassSelectionModals';
import CharacterBackground from './CharacterBackground';

const Character: React.FC = () => {
  const { selectedRace, selectedClass } = useCharacter();

  // Check if either race or class is selected
  const hasSelection = selectedRace || selectedClass;

  return (
    <Box p={3}>
      {/* Character Level Section */}
      <CharacterLevel />
      
      {/* Character Selection Section */}
      <Box 
        bg="gray.800" 
        borderRadius="lg" 
        boxShadow="sm"
        overflow="hidden"
        mb={4}
        borderWidth="1px"
        borderColor="gray.700"
      >
        <Box p={4}>
          <VStack spacing={4} align="stretch">
            {/* Race and Class Selection with uniform-sized buttons */}
            <Box display="flex" flexDirection={{ base: "column", md: "row" }} gap={4}>
              <Box flex={1}>
                <Text fontWeight="semibold" fontSize="sm" mb={2} color="gray.300">Race</Text>
                <Box height="40px">
                  <RaceSelectionModals />
                </Box>
              </Box>
              <Box flex={1}>
                <Text fontWeight="semibold" fontSize="sm" mb={2} color="gray.300">Class</Text>
                <Box height="40px">
                  <ClassSelectionModals />
                </Box>
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Character Background - only displayed if race or class is selected */}
      {hasSelection && <CharacterBackground />}
    </Box>
  );
};

export default Character;