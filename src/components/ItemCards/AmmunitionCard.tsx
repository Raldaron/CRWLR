import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Badge,
  Flex,
  HStack,
} from '@chakra-ui/react';
import type { AmmunitionItem } from '@/types/ammunition';

interface AmmunitionCardProps {
  item: AmmunitionItem;
  onClick?: () => void;
}

export const AmmunitionCard: React.FC<AmmunitionCardProps> = ({ item, onClick }) => {
  const getRarityScheme = (rarity: string = 'common') => {
    switch(rarity.toLowerCase()) {
      case 'ordinary': return 'gray';
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray';
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

          <HStack spacing={2}>
            {item.damageAmount && (
              <Text fontSize="sm" fontWeight="semibold">
                {item.damageAmount}
              </Text>
            )}
            {item.damageType && (
              <Badge colorScheme={getDamageTypeColor(item.damageType)}>
                {item.damageType}
              </Badge>
            )}
          </HStack>

          {item.range && (
            <Text fontSize="sm">
              Range: {item.range} ft
            </Text>
          )}

          {item.radius && (
            <Text fontSize="sm">
              Blast Radius: {item.radius} ft
            </Text>
          )}

          {item.triggerMechanism && (
            <Badge variant="outline" colorScheme="purple">
              {item.triggerMechanism}
            </Badge>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AmmunitionCard;