import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center, // Import Center for loading state
} from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface Trait {
  name: string;
  description: string;
  effect: string;
}

const Traits = () => {
  const {
    selectedRace,
    selectedClass,
    getEquipmentTraits
  } = useCharacter();

  // Store traits keyed by their *lowercase* ID/key for consistent lookup
  const [traitsData, setTraitsData] = useState<{ [key: string]: Trait }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraitsFromFirestore = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const traitsRef = collection(db, 'traits');
        const querySnapshot = await getDocs(traitsRef);

        // Store traits keyed by their lowercase document ID
        const traitsObject: { [key: string]: Trait } = {};
        querySnapshot.forEach((doc) => {
          const traitData = doc.data() as Trait;
          // Ensure the name field exists, fallback to doc.id if needed
          const traitName = traitData.name || doc.id;
          traitsObject[doc.id.toLowerCase()] = {
            ...traitData,
            name: traitName // Use fetched name or ID as fallback
          };
        });

        setTraitsData(traitsObject);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching traits from Firestore:', error);
        setError('Failed to load traits data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchTraitsFromFirestore();
  }, []);

  if (isLoading) {
    return (
      <Center h="400px"> {/* Use Center for better alignment */}
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" /> {/* Use theme color */}
          <Text mt={4} color="gray.300">Loading traits...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="red.400">{error}</Text>
      </Box>
    );
  }

  // Get all trait keys/IDs from different sources
  const racialTraits = selectedRace?.traits || [];
  const classTraits = selectedClass?.traits || [];
  const equipmentTraits = getEquipmentTraits();

  // Combine all trait keys/IDs and remove duplicates
  const allTraitKeys = Array.from(new Set([
    ...racialTraits,
    ...classTraits,
    ...equipmentTraits
  ]));

  // No traits message if no sources are selected or no traits found
  if (allTraitKeys.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.400">No traits found for this character.</Text>
        <Text color="gray.500" fontSize="sm">Select a race, class, or equip items to view traits.</Text>
      </Box>
    );
  }

  // --- FIX START: Modified Trait Lookup Logic ---
  const traitDetails = allTraitKeys.map(traitKey => {
    // Normalize the key from race/class/equipment for lookup
    const normalizedKey = traitKey.toLowerCase();
    // Directly look up the trait using the normalized key in our fetched data
    const trait = traitsData[normalizedKey];

    // Track where this trait comes from (using the original key for includes check)
    const sources = [];
    if (racialTraits.includes(traitKey)) sources.push('Race');
    if (classTraits.includes(traitKey)) sources.push('Class');
    if (equipmentTraits.includes(traitKey)) sources.push('Equipment');

    // Return the found trait details or a fallback object
    return {
      ...(trait || { // Use found trait details or fallback
        name: traitKey, // Fallback name is the original key
        description: "Trait details not found in database.",
        effect: ""
      }),
      key: traitKey, // Store the original key for React list keys
      sources
    };
  });
  // --- FIX END ---

  return (
    <ScrollArea className="h-[600px] pr-4">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} p={4}>
        {traitDetails.map((trait) => ( // Use the original key for React's key prop
          <Box
            key={trait.key} // Use the original key here
            bg="gray.800"
            borderRadius="lg"
            boxShadow="sm"
            p={4}
            transition="all 0.2s"
            _hover={{ boxShadow: "md", borderColor: "orange.700" }}
            borderWidth="1px"
            borderColor="gray.700"
          >
            <VStack align="start" spacing={2}>
              <Box w="full">
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="orange.400"
                  mb={2}
                >
                  {trait.name} {/* Display the correct name */}
                </Text>
                {/* Source badges */}
                <HStack spacing={2} mb={2}>
                  {trait.sources.map((source, idx) => (
                    <Badge
                      key={idx}
                      colorScheme={
                        source === 'Race' ? 'green' :
                        source === 'Class' ? 'purple' :
                        'blue'
                      }
                      fontSize="xs"
                    >
                      {source}
                    </Badge>
                  ))}
                </HStack>
              </Box>
              <Text color="gray.300">
                {trait.description}
              </Text>
              {trait.effect && (
                <Text
                  color="gray.400"
                  fontSize="sm"
                  fontStyle="italic"
                >
                  Effect: {trait.effect}
                </Text>
              )}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </ScrollArea>
  );
};

export default Traits;