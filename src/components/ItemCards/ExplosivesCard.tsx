import React from 'react';
import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { Bomb } from 'lucide-react';
import type { ExplosiveItem } from '@/types/explosives';

interface ExplosivesCardProps {
  item: ExplosiveItem;
  onClick: () => void; // Assume onClick is required
}

// Ensure component is exported if used elsewhere
export const ExplosivesCard: React.FC<ExplosivesCardProps> = ({ item, onClick }) => {
  // Function to get badge color based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) { // Added safety check
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'very rare': return 'red'; // Added very rare
      default: return 'gray';
    }
  };

  return (
    <Box
      bg="gray.800" // Use dark theme colors
      borderRadius="md"
      boxShadow="sm" // Adjusted shadow for dark theme
      p={3}
      cursor="pointer"
      onClick={onClick}
      borderWidth="1px"
      borderColor="gray.700" // Darker border
      _hover={{ borderColor: "red.600", boxShadow: "md" }} // Hover effect
      transition="all 0.2s"
      height="full" // Make card fill available height
    >
      <VStack spacing={2} align="start" height="full" justify="space-between">
        {/* Top Section: Rarity & Icon */}
        <HStack width="100%" justify="space-between">
          <Badge colorScheme={getRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
          <Bomb size={16} className="text-red-500" />
        </HStack>

        {/* Middle Section: Name & Description */}
        <VStack align="start" spacing={1} flexGrow={1}>
             <Text fontWeight="bold" fontSize="md" color="gray.200" noOfLines={1}> {/* Title limited to 1 line */}
                {item.name}
            </Text>
             <Text fontSize="xs" color="gray.400" noOfLines={2}> {/* Description limited to 2 lines */}
                {item.description}
            </Text>
        </VStack>

        {/* Bottom Section: Damage & Radius */}
        <HStack justify="space-between" width="100%" fontSize="xs" color="gray.300" mt="auto">
          <Text>Damage: {item.damage || 'N/A'}</Text> {/* Use item.damage */}
          <Text>Radius: {item.blastRadius || 'N/A'}</Text> {/* Use item.blastRadius */}
        </HStack>
      </VStack>
    </Box>
  );
};

// Default export for compatibility if previously used
export default ExplosivesCard;