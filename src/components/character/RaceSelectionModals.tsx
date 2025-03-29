import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  SimpleGrid,
  Box,
  Text,
  Flex,
  Icon,
  VStack,
  HStack,
  Badge,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Shield, Sword, Star } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import type { Race } from '@/types/race';

const RaceSelectionModals = () => {
  const { selectedRace, setSelectedRace } = useCharacter();
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRaceDetails, setSelectedRaceDetails] = useState<Race | null>(null);
  const [racesData, setRacesData] = useState<{[key: string]: Race}>({});
  const [isLoading, setIsLoading] = useState(true);

  // Responsive layout
  const gridColumns = useBreakpointValue({ base: 1, sm: 2, md: 3 }) || 1;
  const modalSize = useBreakpointValue({ base: "full", md: "2xl", lg: "4xl" }) || "full";

  // Load race data from JSON file
  useEffect(() => {
    const loadRacesData = async () => {
      try {
        const response = await fetch('/data/races.json');
        const data = await response.json();
        setRacesData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading races data:', error);
        setIsLoading(false);
      }
    };

    loadRacesData();
  }, []);

  const handleRaceClick = (race: Race) => {
    setSelectedRaceDetails(race);
    setIsMainOpen(false);
    setIsDetailsOpen(true);
  };

  const handleConfirmSelection = () => {
    if (selectedRaceDetails) {
      setSelectedRace(selectedRaceDetails);
      setIsDetailsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsMainOpen(true)}
        variant="outline"
        colorScheme="brand"
        width="100%"
        height="100%"
        bg="gray.800"
        borderColor="gray.600"
        _hover={{ bg: "gray.700", borderColor: "brand.400" }}
      >
        {selectedRace ? selectedRace.name : "Select Race"}
      </Button>

      {/* Main Race Selection Modal */}
      <Modal isOpen={isMainOpen} onClose={() => setIsMainOpen(false)} size={modalSize}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.100">Choose Your Race</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner color="brand.400" />
              </Flex>
            ) : (
              <SimpleGrid columns={gridColumns} spacing={3} pb={4}>
                {Object.entries(racesData).map(([key, race]) => (
                  <Box 
                    key={key}
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                    cursor="pointer"
                    bg="gray.750"
                    onClick={() => handleRaceClick(race as Race)}
                    _hover={{ bg: "gray.700", borderColor: "brand.400" }}
                    transition="all 0.2s"
                    borderColor="gray.600"
                  >
                    <Text fontWeight="bold" mb={1} color="gray.100">{race.name}</Text>
                    <Text fontSize="xs" color="gray.400" noOfLines={2}>
                      {race.description}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Race Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} size={modalSize}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent maxH="85vh" overflowY="auto" bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.100">{selectedRaceDetails?.name}</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={0}>
            {selectedRaceDetails && (
              <VStack spacing={4} align="stretch">
                {/* Description */}
                <Text fontSize="sm" color="gray.300">{selectedRaceDetails.description}</Text>

                {/* Details in Accordion */}
                <Accordion allowMultiple defaultIndex={[0]}>
                  {/* Stat Bonuses */}
                  {Object.keys(selectedRaceDetails.statbonus).length > 0 && (
                    <AccordionItem border="none" borderBottomWidth="1px" borderColor="gray.700">
                      <AccordionButton py={2} _hover={{ bg: "gray.700" }}>
                        <Box flex="1" textAlign="left" fontWeight="medium" color="gray.200">Stat Bonuses</Box>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <SimpleGrid columns={2} spacing={2}>
                          {Object.entries(selectedRaceDetails.statbonus).map(([stat, bonus]) => (
                            <Flex 
                              key={stat} 
                              align="center" 
                              bg="blue.900"
                              p={2} 
                              borderRadius="md"
                            >
                              <Icon as={Star} color="blue.400" boxSize={3} mr={1} />
                              <Text fontSize="sm" color="gray.200">
                                +{bonus} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                              </Text>
                            </Flex>
                          ))}
                        </SimpleGrid>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Skill Bonuses */}
                  {Object.keys(selectedRaceDetails.skillbonus).length > 0 && (
                    <AccordionItem border="none" borderBottomWidth="1px" borderColor="gray.700">
                      <AccordionButton py={2} _hover={{ bg: "gray.700" }}>
                        <Box flex="1" textAlign="left" fontWeight="medium" color="gray.200">Skill Bonuses</Box>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <SimpleGrid columns={2} spacing={2}>
                          {Object.entries(selectedRaceDetails.skillbonus).map(([skill, bonus]) => (
                            <Flex 
                              key={skill} 
                              align="center" 
                              bg="green.900"
                              p={2} 
                              borderRadius="md"
                            >
                              <Icon as={Sword} color="green.400" boxSize={3} mr={1} />
                              <Text fontSize="sm" color="gray.200">
                                +{bonus} {skill.charAt(0).toUpperCase() + skill.slice(1)}
                              </Text>
                            </Flex>
                          ))}
                        </SimpleGrid>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Abilities */}
                  {selectedRaceDetails.abilities.length > 0 && (
                    <AccordionItem border="none" borderBottomWidth="1px" borderColor="gray.700">
                      <AccordionButton py={2} _hover={{ bg: "gray.700" }}>
                        <Box flex="1" textAlign="left" fontWeight="medium" color="gray.200">Abilities</Box>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack align="stretch" spacing={2}>
                          {selectedRaceDetails.abilities.map((ability) => (
                            <Flex 
                              key={ability}
                              align="center" 
                              bg="purple.900"
                              p={2} 
                              borderRadius="md"
                            >
                              <Icon as={Shield} color="purple.400" boxSize={3} mr={1} />
                              <Text fontSize="sm" color="gray.200">{ability}</Text>
                            </Flex>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  )}

                  {/* Traits */}
                  {selectedRaceDetails.traits.length > 0 && (
                    <AccordionItem border="none" borderBottomWidth="1px" borderColor="gray.700">
                      <AccordionButton py={2} _hover={{ bg: "gray.700" }}>
                        <Box flex="1" textAlign="left" fontWeight="medium" color="gray.200">Traits</Box>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack align="stretch" spacing={2}>
                          {selectedRaceDetails.traits.map((trait) => (
                            <Flex 
                              key={trait}
                              align="center" 
                              bg="orange.900"
                              p={2} 
                              borderRadius="md"
                            >
                              <Icon as={Star} color="orange.400" boxSize={3} mr={1} />
                              <Text fontSize="sm" color="gray.200">{trait}</Text>
                            </Flex>
                          ))}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Quick Stats */}
                <HStack spacing={3} py={2}>
                  <Badge colorScheme="blue">
                    AR: {selectedRaceDetails.armorrating}
                  </Badge>
                  {Object.values(selectedRaceDetails.statbonus).reduce((a, b) => a + b, 0) > 0 && (
                    <Badge colorScheme="green">
                      +{Object.values(selectedRaceDetails.statbonus).reduce((a, b) => a + b, 0)} Total Stats
                    </Badge>
                  )}
                </HStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDetailsOpen(false)} color="gray.300">
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleConfirmSelection}>
              Select
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RaceSelectionModals;