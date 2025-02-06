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
import classesData from '@/data/classes.json';
import { useCharacter } from '@/context/CharacterContext';

// Define what a class looks like
interface Class {
  name: string;
  description: string;
  archetype: string;
  primarystats: string[];
  statbonus: {
    [key: string]: number;
  };
  skillbonus: {
    [key: string]: number;
  };
  abilities: string[];
  traits: string[];
  armorrating: number;
}

const ClassSelectionModals = () => {
  // Track selected class and modal states
  const { selectedClass, setSelectedClass } = useCharacter();
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<Class | null>(null);

  // Handle clicking a class in the list
  const handleClassClick = (classData: Class) => {
    setSelectedClassDetails(classData);
    setIsMainOpen(false);
    setIsDetailsOpen(true);
  };

  // Handle confirming class selection
  const handleConfirmSelection = () => {
    if (selectedClassDetails) {
      setSelectedClass(selectedClassDetails);
      setIsDetailsOpen(false);
    }
  };

  return (
    <>
      {/* Select Class Button */}
      <Button
        onClick={() => setIsMainOpen(true)}
        variant="outline"
        width="full"
      >
        {selectedClass ? selectedClass.name : "Select Class"}
      </Button>

      {/* Class List Modal */}
      <Modal isOpen={isMainOpen} onClose={() => setIsMainOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose Your Class</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} pb={4}>
              {Object.entries(classesData).map(([key, classData]) => (
                <Card 
                  key={key}
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleClassClick(classData as Class)}
                >
                  <CardContent className="p-4">
                    <Text fontSize="lg" fontWeight="bold" mb={2}>{classData.name}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {classData.description}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Class Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="85vh" overflowY="auto">
          <ModalHeader>{selectedClassDetails?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedClassDetails && (
              <Box className="space-y-6">
                {/* Description */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Description</Text>
                  <Text color="gray.700">{selectedClassDetails.description}</Text>
                </Box>

                {/* Archetype */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Archetype</Text>
                  <Text color="gray.700">{selectedClassDetails.archetype}</Text>
                </Box>

                {/* Primary Stats */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Primary Stats</Text>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                    {selectedClassDetails.primarystats.map((stat) => (
                      <Flex 
                        key={stat}
                        align="center" 
                        bg="purple.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="purple.500" mr={2} />
                        <Text>{stat}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Stat Bonuses */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Stat Bonuses</Text>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {Object.entries(selectedClassDetails.statbonus).map(([stat, bonus]) => (
                      <Flex 
                        key={stat} 
                        align="center" 
                        bg="blue.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="blue.500" mr={2} />
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
                    {Object.entries(selectedClassDetails.skillbonus).map(([skill, bonus]) => (
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
                    {selectedClassDetails.abilities.map((ability) => (
                      <Flex 
                        key={ability}
                        align="center" 
                        bg="yellow.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="yellow.500" mr={2} />
                        <Text>{ability}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Traits */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Traits</Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {selectedClassDetails.traits.map((trait) => (
                      <Flex 
                        key={trait}
                        align="center" 
                        bg="orange.50" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Shield} color="orange.500" mr={2} />
                        <Text>{trait}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Base Armor Rating */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Base Armor Rating</Text>
                  <Flex align="center" bg="gray.50" p={2} borderRadius="md" width="fit-content">
                    <Icon as={Shield} color="gray.500" mr={2} />
                    <Text>{selectedClassDetails.armorrating}</Text>
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
              Select {selectedClassDetails?.name}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ClassSelectionModals;