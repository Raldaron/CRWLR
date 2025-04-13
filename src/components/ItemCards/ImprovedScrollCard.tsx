// components/ItemCards/ImprovedScrollCard.tsx

import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Badge,
  Flex,
  HStack,
  Box,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { ScrollText, Clock, Zap, Target, BarChart } from 'lucide-react';
import type { ScrollItem } from '@/types/scroll';

interface ScrollCardProps {
  item: ScrollItem;
  onClick?: () => void;
}

export const ImprovedScrollCard: React.FC<ScrollCardProps> = ({ item, onClick }) => {
  // Helper function to determine badge color based on mana cost
  const getManaCostColor = (cost: string | number) => {
    const manaValue = typeof cost === 'string' ? parseInt(cost) : cost;
    if (isNaN(manaValue) || manaValue === 0) return 'gray';
    if (manaValue <= 2) return 'blue';
    if (manaValue <= 5) return 'purple';
    return 'red';
  };

  // Helper function to determine badge color based on cooldown
  const getCooldownColor = (cooldown: string) => {
    if (!cooldown || cooldown === 'N/A' || cooldown === '-') return 'gray';
    if (cooldown.toLowerCase().includes('turn')) return 'green';
    if (cooldown.toLowerCase().includes('minute')) return 'yellow';
    return 'orange';
  };

  // Helper function to determine rarity color
  const getRarityColor = (rarity: string = 'common') => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      default: return 'gray';
    }
  };

  // Check if scroll has scaling effects
  const hasScaling = item.scaling && 
    typeof item.scaling === 'object' && 
    !Array.isArray(item.scaling) && 
    Object.keys(item.scaling).length > 0;

  return (
    <Card 
      h="full" 
      _hover={{ 
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: 'orange.500' 
      }} 
      transition="all 0.2s"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      borderLeft="4px solid"
      borderColor="orange.400"
      bg="gray.800"
      color="gray.200"
    >
      <CardBody>
        <VStack align="start" spacing={2}>
          <Flex justify="space-between" w="full" align="center">
            <HStack spacing={2}>
              <Icon as={ScrollText} color="orange.400" boxSize={4} />
              <Text fontWeight="bold" fontSize="md" noOfLines={1}>{item.name}</Text>
            </HStack>
            <Badge colorScheme={getRarityColor(item.rarity)} size="sm">
              {item.rarity || 'Common'}
            </Badge>
          </Flex>
          
          <Text fontSize="xs" color="gray.400" noOfLines={2}>
            {item.description || item.effect || 'No description available.'}
          </Text>
          
          <HStack spacing={2} wrap="wrap">
            {/* Cast Time */}
            <Tooltip label="Cast Time" placement="top">
              <HStack spacing={1}>
                <Icon as={Clock} boxSize={3} color="cyan.400" />
                <Text fontSize="xs">{item.castingTime || '-'}</Text>
              </HStack>
            </Tooltip>

            {/* Mana Cost */}
            <Tooltip label="Mana Cost" placement="top">
              <Badge colorScheme={getManaCostColor(item.manaPointCost)} variant="subtle" fontSize="xs">
                <HStack spacing={1}>
                  <Icon as={Zap} boxSize={3} />
                  <Text>{item.manaPointCost || '-'}</Text>
                </HStack>
              </Badge>
            </Tooltip>

            {/* Cooldown if present */}
            {item.cooldown && item.cooldown !== 'N/A' && (
              <Tooltip label="Cooldown" placement="top">
                <Badge colorScheme={getCooldownColor(item.cooldown)} variant="outline" fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={Clock} boxSize={3} />
                    <Text>{item.cooldown}</Text>
                  </HStack>
                </Badge>
              </Tooltip>
            )}
          </HStack>

          {/* Damage Information (if applicable) */}
          {(item.damageAmount && item.damageAmount !== 'N/A' && item.damageAmount !== '-') && (
            <HStack spacing={1}>
              <Icon as={Target} boxSize={3} color="red.400" />
              <Text fontSize="xs" color="red.300">
                {item.damageAmount} {item.damageType} damage
              </Text>
            </HStack>
          )}

          {/* Scaling indicator */}
          {hasScaling && (
            <Tooltip label="Has level scaling effects" placement="top">
              <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                <HStack spacing={1}>
                  <Icon as={BarChart} boxSize={3} />
                  <Text>Scales with level</Text>
                </HStack>
              </Badge>
            </Tooltip>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ImprovedScrollCard;