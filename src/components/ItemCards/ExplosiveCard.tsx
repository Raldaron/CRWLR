import React from 'react';
import {
  Box,
  Text,
  Badge,
  VStack,
  HStack
} from '@chakra-ui/react';
import { Bomb } from 'lucide-react';
// Fix the import path to use the correct location
import type { ExplosiveItem } from '@/types/explosives';

interface ExplosiveCardProps {
  item: ExplosiveItem;
  onClick: () => void;
}

const ExplosiveCard: React.FC<ExplosiveCardProps> = ({ item, onClick }) => {
  // Function to get badge color based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'very rare': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box
      bg="gray.800"
      borderRadius="md"
      boxShadow="md"
      p={3}
      cursor="pointer"
      onClick={onClick}
      borderWidth="1px"
      borderColor="gray.700"
      _hover={{ borderColor: "red.600", boxShadow: "lg" }}
      transition="all 0.2s"
    >
      <VStack spacing={2} align="start">
        <HStack width="100%" justify="space-between">
          <Badge colorScheme={getRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
          <Bomb size={16} className="text-red-500" />
        </HStack>
        
        <Text fontWeight="bold" fontSize="md" color="gray.200">
          {item.name}
        </Text>
        
        <Text fontSize="xs" color="gray.400" noOfLines={2}>
          {item.description}
        </Text>
        
        <HStack justify="space-between" width="100%" fontSize="xs" color="gray.300">
          <Text>Damage: {item.damage}</Text>
          <Text>Radius: {item.blastRadius}</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ExplosiveCard;