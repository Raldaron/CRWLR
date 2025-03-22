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
import { Clock, Target } from 'lucide-react';
import type { PotionItem } from '../../types/potion';

interface PotionCardProps {
  item: PotionItem;
  onClick?: () => void;
}

export const PotionCard: React.FC<PotionCardProps> = ({ item, onClick }) => {
  const getRarityScheme = (rarity: string = 'common') => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
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
            <Flex align="center" gap={1}>
              <Clock className="h-4 w-4 text-gray-500" />
              <Text fontSize="sm" color="gray.600">
                {item.duration}
              </Text>
            </Flex>
            {item.range !== 'N/A' && (
              <Flex align="center" gap={1}>
                <Target className="h-4 w-4 text-gray-500" />
                <Text fontSize="sm" color="gray.600">
                  {item.range}
                </Text>
              </Flex>
            )}
          </HStack>

          {/* Preview of effects or bonuses if they exist */}
          {(Object.keys(item.statBonus).length > 0 || Object.keys(item.skillBonus).length > 0) && (
            <VStack align="start" spacing={1}>
              {Object.entries(item.statBonus).map(([stat, bonus], index) => (
                <Text key={`stat-${index}`} fontSize="sm">
                  {typeof bonus === 'number' ? `+${bonus}` : bonus} {stat}
                </Text>
              ))}
              {Object.entries(item.skillBonus).map(([skill, bonus], index) => (
                <Text key={`skill-${index}`} fontSize="sm">
                  +{bonus} {skill}
                </Text>
              ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PotionCard;