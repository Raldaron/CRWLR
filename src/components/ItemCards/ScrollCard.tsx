// components/ItemCards/ScrollCard.tsx

import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Badge,
  Flex,
  HStack,
  Box
} from '@chakra-ui/react';
import { Scroll, Clock, Zap } from 'lucide-react';
import type { ScrollItem } from '@/types/scroll';

interface ScrollCardProps {
  item: ScrollItem;
  onClick?: () => void;
}

export const ScrollCard: React.FC<ScrollCardProps> = ({ item, onClick }) => {
  // Helper function to determine badge color based on mana cost
  const getManaCostColor = (cost: string | number) => {
    // Convert cost to number if it's a string
    const manaValue = typeof cost === 'string' ? parseInt(cost) : cost;
    
    // Check for NaN in case parseInt fails
    if (isNaN(manaValue) || manaValue === 0) return 'gray';
    if (manaValue <= 2) return 'blue';
    if (manaValue <= 5) return 'purple';
    return 'red';
  };

  // Helper function to determine badge color based on cooldown
  const getCooldownColor = (cooldown: string) => {
    if (cooldown.includes('turn')) return 'green';
    if (cooldown.includes('minute')) return 'yellow';
    return 'orange';
  };

  return (
    <Card 
      h="full" 
      _hover={{ shadow: 'md' }} 
      transition="all 0.2s"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      borderLeft="4px solid"
      borderColor="purple.400"
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <Flex justify="space-between" w="full" align="center">
            <HStack spacing={2}>
              <Scroll size={16} className="text-purple-500" />
              <Text fontWeight="bold" fontSize="lg">{item.name}</Text>
            </HStack>
          </Flex>
          
          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {item.description}
          </Text>
          
          <VStack align="start" spacing={1} width="full">
            {/* Cast Time and Cooldown */}
            <HStack spacing={4}>
              <HStack>
                <Clock size={14} />
                <Text fontSize="sm">{item.castingTime}</Text>
              </HStack>
              <Badge colorScheme={getCooldownColor(item.cooldown)}>
                CD: {item.cooldown}
              </Badge>
            </HStack>

            {/* Mana Cost and Range */}
            <HStack spacing={4}>
              <Badge colorScheme={getManaCostColor(item.manaPointCost)}>
                <HStack spacing={1}>
                  <Zap size={12} />
                  <Text>{item.manaPointCost}</Text>
                </HStack>
              </Badge>
              <Text fontSize="sm">Range: {item.range}</Text>
            </HStack>

            {/* Damage Information (if applicable) */}
            {item.damageAmount !== 'N/A' && (
              <Box>
                <Text fontSize="sm">
                  {item.damageAmount} {item.damageType} damage
                </Text>
              </Box>
            )}
          </VStack>

          {/* Modifier */}
          <Text fontSize="sm" color="purple.500">
            {item.spellCastingModifier} modifier
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ScrollCard;