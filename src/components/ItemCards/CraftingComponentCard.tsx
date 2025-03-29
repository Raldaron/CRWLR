import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  Text,
  Badge,
  Flex,
  Box
} from '@chakra-ui/react';
import type { CraftingComponentItem } from '@/types/craftingcomponent';

interface CraftingComponentCardProps {
  item: CraftingComponentItem;
  onClick?: () => void;
}

export const CraftingComponentCard: React.FC<CraftingComponentCardProps> = ({ item, onClick }) => {
  const getRarityScheme = (rarity: string = 'common') => {
    switch(rarity.toLowerCase()) {
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
    <Card 
      h="full" 
      _hover={{ shadow: 'md' }} 
      transition="all 0.2s"
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      bg="gray.50"
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
          
          <Box w="full">
            <Text fontSize="sm" fontWeight="semibold">Effect:</Text>
            <Text fontSize="sm">{item.effect}</Text>
          </Box>

          <Flex justify="space-between" w="full">
            <Badge variant="outline">
              Duration: {item.duration}
            </Badge>
            {item.range !== 'N/A' && (
              <Badge variant="outline">
                Range: {item.range}
              </Badge>
            )}
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default CraftingComponentCard;