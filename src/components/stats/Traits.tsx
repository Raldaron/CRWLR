import React from 'react';
import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
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
  const { selectedRace, selectedClass } = useCharacter();
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

  if (!selectedRace && !selectedClass) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">Select a race and class to view traits</Text>
      </Box>
    );
  }

  if (!traitsData) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">Loading traits...</Text>
      </Box>
    );
  }

  // Combine traits from both race and class using Array.from
  const racialTraits = selectedRace?.traits || [];
  const classTraits = selectedClass?.traits || [];
  const allTraits = Array.from(new Set([...racialTraits, ...classTraits]));

  const traitDetails = allTraits.map(traitName => {
    const trait = Object.values(traitsData.traits).find(
      t => t.name.toLowerCase() === traitName.toLowerCase()
    );
    
    return trait || { 
      name: traitName, 
      description: "Trait details not found",
      effect: ""
    };
  });

  return (
    <ScrollArea className="h-[600px] pr-4">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} p={4}>
        {traitDetails.map((trait, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent>
              <VStack align="start" spacing={2} p={4}>
                <Text 
                  fontSize="lg" 
                  fontWeight="bold" 
                  color="blue.600"
                >
                  {trait.name}
                </Text>
                <Text color="gray.700">
                  {trait.description}
                </Text>
                {trait.effect && (
                  <Text 
                    color="gray.600" 
                    fontSize="sm" 
                    fontStyle="italic"
                  >
                    Effect: {trait.effect}
                  </Text>
                )}
              </VStack>
            </CardContent>
          </Card>
        ))}
      </SimpleGrid>
    </ScrollArea>
  );
};

export default Traits;