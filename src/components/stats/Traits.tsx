// components/character/Traits.tsx
import React, { useState } from 'react';  // Added useState import
import { Box, Text, VStack } from '@chakra-ui/react';
import { Trait } from '@/types/character';  // Make sure this path matches your project structure

const Traits: React.FC = () => {
  // Initialize with empty array of Traits
  const [traits, setTraits] = useState<Trait[]>([]);

  // Example trait for testing (you can remove this in production)
  React.useEffect(() => {
    setTraits([
      {
        id: '1',
        name: 'Night Vision',
        description: 'Can see clearly in dark environments',
        effect: '+2 to perception checks in darkness'
      }
    ]);
  }, []);

  return (
    <Box>
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">Character Traits</Text>
        {traits.map((trait: Trait) => (
          <Box 
            key={trait.id} 
            p={4} 
            borderWidth="1px" 
            borderRadius="md"
            boxShadow="sm"
            bg="white"
          >
            <Text fontWeight="bold">{trait.name}</Text>
            <Text mt={2}>{trait.description}</Text>
            <Text mt={2} fontStyle="italic" color="gray.600">
              Effect: {trait.effect}
            </Text>
          </Box>
        ))}
        {traits.length === 0 && (
          <Text color="gray.500" textAlign="center">
            No traits available
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default Traits;