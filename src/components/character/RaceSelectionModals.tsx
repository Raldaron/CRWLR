'use client';

import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Sword, Star } from 'lucide-react';
import racesData from '@/data/races.json';
import { useCharacter } from '@/context/CharacterContext';
import type { Race } from '@/types/race';

const RaceSelectionModals = () => {
  const { selectedRace, setSelectedRace } = useCharacter();
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRaceDetails, setSelectedRaceDetails] = useState<Race | null>(null);

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
        width="full"
      >
        {selectedRace ? selectedRace.name : "Select Race"}
      </Button>

      {/* Main Race Selection Modal */}
      <Modal isOpen={isMainOpen} onClose={() => setIsMainOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose Your Race</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} pb={4}>
              {Object.entries(racesData).map(([key, race]) => (
                <Card 
                  key={key}
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleRaceClick(race as Race)}
                >
                  <CardContent className="p-4">
                    <Text fontSize="lg" fontWeight="bold" mb={2}>{race.name}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {race.description}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Race Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="85vh" overflowY="auto">
          <ModalHeader>{selectedRaceDetails?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRaceDetails && (
              <Box className="space-y-6">
                {/* Description */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Description</Text>
                  <Text color="gray.700">{selectedRaceDetails.description}</Text>
                </Box>

                {/* Stat Bonuses */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Stat Bonuses</Text>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {Object.entries(selectedRaceDetails.statbonus).map(([stat, bonus]) => (
                      <Flex 
                        key={stat} 
                        align="center" 
                        bg="blue.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="yellow.500" mr={2} />
                        <Text>
                          +{bonus} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Skill Bonuses */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Skill Bonuses</Text>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {Object.entries(selectedRaceDetails.skillbonus).map(([skill, bonus]) => (
                      <Flex 
                        key={skill} 
                        align="center" 
                        bg="green.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Sword} color="green.500" mr={2} />
                        <Text>
                          +{bonus} {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Abilities */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Abilities</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {selectedRaceDetails.abilities.map((ability) => (
                      <Flex 
                        key={ability}
                        align="center" 
                        bg="purple.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Shield} color="purple.500" mr={2} />
                        <Text>{ability}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Traits */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Traits</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {selectedRaceDetails.traits.map((trait) => (
                      <Flex 
                        key={trait}
                        align="center" 
                        bg="orange.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="orange.500" mr={2} />
                        <Text>{trait}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Lore */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Lore</Text>
                  <Text color="gray.700">{selectedRaceDetails.lore}</Text>
                </Box>

                {/* Base Armor Rating */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Base Armor Rating</Text>
                  <Flex align="center" bg="gray.50" p={2} borderRadius="md" width="fit-content">
                    <Icon as={Shield} color="gray.500" mr={2} />
                    <Text>{selectedRaceDetails.armorrating}</Text>
                  </Flex>
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDetailsOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleConfirmSelection}>
              Select {selectedRaceDetails?.name}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RaceSelectionModals;