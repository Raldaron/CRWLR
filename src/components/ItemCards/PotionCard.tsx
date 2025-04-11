import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Badge,
  Flex,
  HStack
} from '@chakra-ui/react';
import { Clock, Target, Droplet, BatteryCharging } from 'lucide-react'; // Added Droplet, BatteryCharging
import type { PotionItem } from '../../types/potion';

interface PotionCardProps {
  item: PotionItem;
  onClick?: (e?: React.MouseEvent) => void;
}

export const PotionCard: React.FC<PotionCardProps> = ({ item, onClick }) => {
  const getRarityScheme = (rarity: string = 'common') => {
    switch(rarity?.toLowerCase()) { // Safety check
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'very rare': return 'red'; // Added very rare
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'celestial': return 'yellow'; // Added celestial
      default: return 'gray';
    }
  };

  return (
    <Card
      h="full"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <Flex justify="space-between" w="full" align="center">
            <Text fontWeight="bold" fontSize="lg">{item.name}</Text>
            <Badge colorScheme={getRarityScheme(item.rarity)}>
              {item.rarity}
            </Badge>
          </Flex>

          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {item.description}
          </Text>

          <HStack spacing={4}>
            {item.duration && item.duration !== 'N/A' && (
              <Flex align="center" gap={1}>
                <Clock className="h-4 w-4 text-gray-500" />
                <Text fontSize="sm" color="gray.600">
                  {item.duration}
                </Text>
              </Flex>
            )}
            {item.range && item.range !== 'N/A' && (
              <Flex align="center" gap={1}>
                <Target className="h-4 w-4 text-gray-500" />
                <Text fontSize="sm" color="gray.600">
                  {item.range}
                </Text>
              </Flex>
            )}
          </HStack>

          {/* Preview of effects or bonuses if they exist */}
          {/* Show heal/mana back instead of old bonuses */}
           <VStack align="start" spacing={1}>
             {item.healfor && item.healfor !== 'N/A' && (
                 <HStack spacing={1}>
                    <Droplet size={14} color="red"/>
                    <Text fontSize="sm" color="green.600">Heals: {item.healfor}</Text>
                 </HStack>
             )}
             {item.manaback && item.manaback !== 'N/A' && (
                 <HStack spacing={1}>
                     <BatteryCharging size={14} color="blue"/>
                    <Text fontSize="sm" color="blue.600">Mana: +{item.manaback}</Text>
                 </HStack>
             )}
            {item.effect && item.effect.length < 50 && ( // Show brief effect if available
                 <Text fontSize="xs" color="gray.500" fontStyle="italic" noOfLines={1}>
                     Effect: {item.effect}
                 </Text>
            )}
           </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PotionCard;