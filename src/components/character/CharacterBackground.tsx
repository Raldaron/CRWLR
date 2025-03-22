import React from 'react';
import {
  Box,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  VStack,
  HStack,
  Flex,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { Shield, Sword, Star, Info } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';

const CharacterBackground: React.FC = () => {
  const { selectedRace, selectedClass } = useCharacter();

  return (
    <Box 
      bg="gray.800" 
      borderRadius="lg" 
      boxShadow="sm"
      overflow="hidden"
      borderWidth="1px"
      borderColor="gray.700"
    >
      <Accordion allowToggle defaultIndex={[]}>
        {/* Race Details */}
        {selectedRace && (
          <AccordionItem border="none">
            <AccordionButton py={3} px={4} _hover={{ bg: 'gray.700' }}>
              <Box flex="1" textAlign="left">
                <HStack>
                  <Badge colorScheme="green" px={2}>Race</Badge>
                  <Text fontWeight="medium" color="gray.200">{selectedRace.name}</Text>
                </HStack>
              </Box>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel pb={4} px={4} bg="gray.750" borderTop="1px" borderColor="gray.700">
              <VStack align="start" spacing={3}>
                <Text fontSize="sm" color="gray.300">{selectedRace.description}</Text>
                
                {/* Race stats */}
                {Object.keys(selectedRace.statbonus).length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      STAT BONUSES
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {Object.entries(selectedRace.statbonus).map(([stat, bonus]) => (
                        <Badge key={stat} colorScheme="blue" variant="subtle">
                          +{bonus} {stat}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                
                {/* Race abilities */}
                {selectedRace.abilities.length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      ABILITIES
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {selectedRace.abilities.map((ability) => (
                        <Badge key={ability} colorScheme="purple" variant="subtle">
                          {ability}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                
                {/* Race traits */}
                {selectedRace.traits.length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      TRAITS
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {selectedRace.traits.map((trait) => (
                        <Badge key={trait} colorScheme="orange" variant="subtle">
                          {trait}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        )}

        {/* Class Details */}
        {selectedClass && (
          <AccordionItem border="none">
            <AccordionButton py={3} px={4} _hover={{ bg: 'gray.700' }}>
              <Box flex="1" textAlign="left">
                <HStack>
                  <Badge colorScheme="purple" px={2}>Class</Badge>
                  <Text fontWeight="medium" color="gray.200">{selectedClass.name}</Text>
                  <Badge variant="outline" size="sm" colorScheme="purple">
                    {selectedClass.archetype}
                  </Badge>
                </HStack>
              </Box>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel pb={4} px={4} bg="gray.750" borderTop="1px" borderColor="gray.700">
              <VStack align="start" spacing={3}>
                <Text fontSize="sm" color="gray.300">{selectedClass.description}</Text>
                
                {/* Primary stats */}
                <Box width="full">
                  <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                    PRIMARY STATS
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {selectedClass.primarystats.map((stat) => (
                      <Badge key={stat} colorScheme="teal" variant="subtle">
                        {stat}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
                
                {/* Class stats */}
                {Object.keys(selectedClass.statbonus).length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      STAT BONUSES
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {Object.entries(selectedClass.statbonus).map(([stat, bonus]) => (
                        <Badge key={stat} colorScheme="blue" variant="subtle">
                          +{bonus} {stat}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                
                {/* Class abilities */}
                {selectedClass.abilities.length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      ABILITIES
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {selectedClass.abilities.map((ability) => (
                        <Badge key={ability} colorScheme="purple" variant="subtle">
                          {ability}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                
                {/* Class traits */}
                {selectedClass.traits.length > 0 && (
                  <Box width="full">
                    <Text fontSize="xs" fontWeight="semibold" mb={1} color="gray.400">
                      TRAITS
                    </Text>
                    <Flex wrap="wrap" gap={2}>
                      {selectedClass.traits.map((trait) => (
                        <Badge key={trait} colorScheme="orange" variant="subtle">
                          {trait}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  );
};

export default CharacterBackground;