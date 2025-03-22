import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Card,
  CardBody,
  HStack,
  IconButton,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import RaceSelectionModals from './RaceSelectionModals';
import ClassSelectionModals from './ClassSelectionModals';

const ConsolidatedCharacterCard = () => {
  const { 
    selectedRace, 
    selectedClass, 
    characterLevel, 
    setCharacterLevel 
  } = useCharacter();

  // Function to handle leveling up
  const handleLevelUp = () => {
    if (characterLevel < 100) { // Maximum level is 20
      setCharacterLevel(characterLevel + 1);
    }
  };

  // Function to handle leveling down
  const handleLevelDown = () => {
    if (characterLevel > 1) { // Minimum level is 1
      setCharacterLevel(characterLevel - 1);
    }
  };

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-all">
      <CardBody className="p-6">
        <VStack spacing={6} align="stretch">
          {/* Background info section */}
          <Box bg="blue.50" p={4} borderRadius="md">
            <VStack spacing={3} align="start">
              <HStack width="full" justify="space-between" spacing={4}>
                <Text fontWeight="bold" fontSize="lg">Race:</Text>
                <Box flex="1">
                  <RaceSelectionModals />
                </Box>
              </HStack>
              
              <HStack width="full" justify="space-between" spacing={4}>
                <Text fontWeight="bold" fontSize="lg">Class:</Text>
                <Box flex="1">
                  <ClassSelectionModals />
                </Box>
              </HStack>
            </VStack>
          </Box>
          
          <Divider />
          
          {/* Character Level Section */}
          <Box 
            p={6} 
            borderRadius="lg" 
            bg="blue.50" 
            position="relative"
            borderLeft="4px solid"
            borderColor="blue.500"
          >
            <VStack spacing={3}>
              <Text fontWeight="bold" fontSize="xl" textAlign="center" color="blue.700">
                Character Level
              </Text>
              
              <HStack spacing={6} justify="center" align="center">
                <IconButton
                  aria-label="Decrease level"
                  icon={<ChevronDown />}
                  isDisabled={characterLevel <= 1}
                  onClick={handleLevelDown}
                  colorScheme="blue"
                  variant="outline"
                  size="md"
                  borderRadius="full"
                />
                
                <VStack spacing={0}>
                  <Text fontSize="4xl" fontWeight="bold" color="blue.700">
                    {characterLevel}
                  </Text>
                  <HStack>
                    <Text fontSize="sm" color="blue.600">Level</Text>
                    <Tooltip label="Character level affects HP, MP, AP, and available skill points">
                      <Box as="span" cursor="help">
                        <Info size={12} />
                      </Box>
                    </Tooltip>
                  </HStack>
                </VStack>

                <IconButton
                  aria-label="Increase level"
                  icon={<ChevronUp />}
                  isDisabled={characterLevel >= 100}
                  onClick={handleLevelUp}
                  colorScheme="blue"
                  size="md"
                  borderRadius="full"
                />
              </HStack>
              
              {characterLevel >= 100 && (
                <Badge colorScheme="red">Maximum Level</Badge>
              )}
            </VStack>
          </Box>
            
            {/* Display Race and Class info */}
            {(selectedRace || selectedClass) && (
              <Box 
                mt={4} 
                p={4} 
                borderRadius="md" 
                bg="white" 
                width="full"
                border="1px"
                borderColor="gray.200"
                boxShadow="sm"
              >
                <VStack spacing={3} align="start">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600">Current Selection:</Text>
                  
                  {selectedRace && (
                    <HStack>
                      <Badge colorScheme="green" px={2} py={1}>
                        Race: {selectedRace.name}
                      </Badge>
                      {Object.keys(selectedRace.statbonus).length > 0 && (
                        <Text fontSize="xs" color="gray.500">
                          (+{Object.values(selectedRace.statbonus).reduce((a, b) => a + b, 0)} total stat bonus)
                        </Text>
                      )}
                    </HStack>
                  )}
                  
                  {selectedClass && (
                    <HStack>
                      <Badge colorScheme="purple" px={2} py={1}>
                        Class: {selectedClass.name}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        ({selectedClass.archetype})
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
    </Card>
  );
};

export default ConsolidatedCharacterCard;