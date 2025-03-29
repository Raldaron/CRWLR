import React from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { Card } from '@/components/ui/card';
import { useCharacter } from '@/context/CharacterContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Trait {
  name: string;
  description: string;
  effect: string;
}

interface TraitsData {
  traits: {
    [key: string]: Trait;
  };
}

const Traits = () => {
  const { 
    selectedRace, 
    selectedClass, 
    getEquipmentTraits 
  } = useCharacter();
  
  const [traitsData, setTraitsData] = React.useState<TraitsData | null>(null);

  React.useEffect(() => {
    const loadTraitsData = async () => {
      try {
        const response = await fetch('/data/traits.json');
        const data = await response.json();
        setTraitsData(data);
      } catch (error) {
        console.error('Error loading traits:', error);
      }
    };

    loadTraitsData();
  }, []);

  if (!traitsData) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.400">Loading traits...</Text>
      </Box>
    );
  }

  // Get all traits from different sources
  const racialTraits = selectedRace?.traits || [];
  const classTraits = selectedClass?.traits || [];
  const equipmentTraits = getEquipmentTraits();

  // No traits message if no sources are selected
  if (!selectedRace && !selectedClass && equipmentTraits.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.400">Select a race, class, or equip items to view traits</Text>
      </Box>
    );
  }

  // Combine all traits and remove duplicates
  const allTraits = Array.from(new Set([
    ...racialTraits,
    ...classTraits,
    ...equipmentTraits
  ]));

  // Get trait details and track sources
  const traitDetails = allTraits.map(traitName => {
    const trait = Object.values(traitsData.traits).find(
      t => t.name.toLowerCase() === traitName.toLowerCase()
    );
    
    // Track where this trait comes from
    const sources = [];
    if (racialTraits.includes(traitName)) sources.push('Race');
    if (classTraits.includes(traitName)) sources.push('Class');
    if (equipmentTraits.includes(traitName)) sources.push('Equipment');
    
    return {
      ...trait || { 
        name: traitName, 
        description: "Trait details not found",
        effect: ""
      },
      sources
    };
  });

  return (
    <ScrollArea className="h-[600px] pr-4">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} p={4}>
        {traitDetails.map((trait, index) => (
          <Box
            key={index}
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
                  {trait.name}
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