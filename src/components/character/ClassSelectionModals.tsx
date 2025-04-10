import React, { useState, useEffect } from 'react';
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
  Spinner,
  VStack,
  HStack,
  Badge,
  useBreakpointValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Shield, Sword, Star } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import type { Class } from '@/types/class';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// Helper function to standardize skill names
const standardizeSkillName = (skillName: string): string => {
  return skillName
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .trim();
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ClassSelectionModals = () => {
  const { selectedClass, setSelectedClass } = useCharacter();
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<Class | null>(null);
  const [classesData, setClassesData] = useState<{[key: string]: Class}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive layout
  const gridColumns = useBreakpointValue({ base: 1, sm: 2, md: 3 }) || 1;
  const modalSize = useBreakpointValue({ base: "full", md: "2xl", lg: "4xl" }) || "full";

  // Load classes data from Firestore
  useEffect(() => {
    const fetchClassesFromFirestore = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create a reference to the 'classes' collection
        const classesRef = collection(db, 'classes');
        
        // Get all documents from the collection
        const querySnapshot = await getDocs(classesRef);
        
        // Check if we got data
        if (querySnapshot.empty) {
          setError('No classes found in the database.');
          setIsLoading(false);
          return;
        }
        
        // Convert the query snapshot to an object
        const classesObject: { [key: string]: Class } = {};
        
        querySnapshot.forEach((doc) => {
          const classData = doc.data() as Class;
          classesObject[doc.id] = classData;
        });
        
        setClassesData(classesObject);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching classes from Firestore:', error);
        setError('Failed to load classes data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchClassesFromFirestore();
  }, []);

  const handleClassClick = (classData: Class) => {
    setSelectedClassDetails(classData);
    setIsMainOpen(false);
    setIsDetailsOpen(true);
  };

  const handleConfirmSelection = () => {
    if (selectedClassDetails) {
      setSelectedClass(selectedClassDetails);
      setIsDetailsOpen(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsMainOpen(true)}
        variant="outline"
        colorScheme="purple"
        width="100%"
        height="100%"
        bg="gray.800"
        borderColor="gray.600"
        _hover={{ bg: "gray.700", borderColor: "purple.400" }}
      >
        {selectedClass ? selectedClass.name : "Select Class"}
      </Button>

      {/* Main Class Selection Modal */}
      <Modal isOpen={isMainOpen} onClose={() => setIsMainOpen(false)} size={modalSize}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.100">Choose Your Class</ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner color="purple.400" />
              </Flex>
            ) : error ? (
              <Alert status="error" bg="red.800" color="white">
                <AlertIcon color="red.300" />
                {error}
              </Alert>
            ) : (
              <SimpleGrid columns={gridColumns} spacing={3} pb={4}>
                {Object.entries(classesData).map(([key, classData]) => (
                  <Box 
                    key={key}
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                    cursor="pointer"
                    bg="gray.750"
                    onClick={() => handleClassClick(classData as Class)}
                    _hover={{ bg: "gray.700", borderColor: "purple.400" }}
                    transition="all 0.2s"
                    borderColor="gray.600"
                  >
                    <Text fontWeight="bold" mb={1} color="gray.100">{classData.name}</Text>
                    <Badge colorScheme="purple" size="sm" mb={1}>
                      {classData.archetype}
                    </Badge>
                    <Text fontSize="xs" color="gray.400" noOfLines={2}>
                      {classData.description}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Class Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} size={modalSize}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent maxH="85vh" overflowY="auto" bg="gray.800" borderColor="gray.700">
          <ModalHeader>
            <Text color="gray.100">{selectedClassDetails?.name}</Text>
            <Badge colorScheme="purple" mt={1}>
              {selectedClassDetails?.archetype}
            </Badge>
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody>
            {selectedClassDetails && (
              <VStack spacing={4} align="stretch">
                {/* Description */}
                <Text color="gray.300">{selectedClassDetails.description}</Text>

                {/* Primary Stats */}
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Primary Stats</Text>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                    {selectedClassDetails.primarystats.map((stat) => (
                      <Flex 
                        key={stat}
                        align="center" 
                        bg="teal.900" 
                        p={2} 
                        borderRadius="md"
                      >
                        <Icon as={Star} color="teal.400" boxSize={3} mr={1} />
                        <Text fontSize="sm" color="gray.200">{capitalizeWords(stat)}</Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Stat Bonuses */}
                {Object.keys(selectedClassDetails.statbonus).length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Stat Bonuses</Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                      {Object.entries(selectedClassDetails.statbonus).map(([stat, bonus]) => (
                        <Flex 
                          key={stat} 
                          align="center" 
                          bg="blue.900" 
                          p={2} 
                          borderRadius="md"
                        >
                          <Icon as={Star} color="blue.400" boxSize={3} mr={1} />
                          <Text fontSize="sm" color="gray.200">
                            +{bonus} {capitalizeWords(stat)}
                          </Text>
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Skill Bonuses */}
                {Object.keys(selectedClassDetails.skillbonus).length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Skill Bonuses</Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                      {Object.entries(selectedClassDetails.skillbonus).map(([skill, bonus]) => {
                        const standardizedSkillName = standardizeSkillName(skill);
                        return (
                          <Flex 
                            key={skill} 
                            align="center" 
                            bg="green.900" 
                            p={2} 
                            borderRadius="md"
                          >
                            <Icon as={Sword} color="green.400" boxSize={3} mr={1} />
                            <Text fontSize="sm" color="gray.200">
                              +{bonus} {capitalizeWords(standardizedSkillName)}
                            </Text>
                          </Flex>
                        );
                      })}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Abilities */}
                {selectedClassDetails.abilities.length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Abilities</Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      {selectedClassDetails.abilities.map((ability) => (
                        <Flex 
                          key={ability}
                          align="center" 
                          bg="purple.900" 
                          p={2} 
                          borderRadius="md"
                        >
                          <Icon as={Star} color="purple.400" boxSize={3} mr={1} />
                          <Text fontSize="sm" color="gray.200">{ability}</Text>
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Traits */}
                {selectedClassDetails.traits.length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Traits</Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      {selectedClassDetails.traits.map((trait) => (
                        <Flex 
                          key={trait}
                          align="center" 
                          bg="orange.900" 
                          p={2} 
                          borderRadius="md"
                        >
                          <Icon as={Shield} color="orange.400" boxSize={3} mr={1} />
                          <Text fontSize="sm" color="gray.200">{trait}</Text>
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Base Armor Rating */}
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={2} color="gray.200">Base Armor Rating</Text>
                  <Badge colorScheme="blue" fontSize="md">
                    AR: {selectedClassDetails.armorrating}
                  </Badge>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDetailsOpen(false)} color="gray.300">
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleConfirmSelection}>
              Select {selectedClassDetails?.name}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ClassSelectionModals;