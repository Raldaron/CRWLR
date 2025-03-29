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
import { Clock, Crosshair } from 'lucide-react';
import type { TrapItem } from '@/types/trap';

interface TrapCardProps {
  item: TrapItem;
  onClick?: () => void;
}

export const TrapCard: React.FC<TrapCardProps> = ({ item, onClick }) => {
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
      border="1px"
      borderColor="red.200"
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
            <HStack spacing={1}>
              <Clock size={14} />
              <Text fontSize="sm">{item.duration}</Text>
            </HStack>
            <HStack spacing={1}>
              <Crosshair size={14} />
              <Text fontSize="sm">{item.range}</Text>
            </HStack>
          </HStack>

          {/* Stats Preview */}
          {(Object.keys(item.vitalbonus).length > 0 || Object.keys(item.skillBonus).length > 0) && (
            <VStack align="start" spacing={1}>
              {Object.entries(item.vitalbonus).map(([stat, bonus], index) => (
                <Text key={`vital-${index}`} fontSize="sm">
                  +{bonus} {stat}
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

export default TrapCard;