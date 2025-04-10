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
import { Clock, Crosshair, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import type { TrapItem } from '@/types/trap';

interface TrapCardProps {
  item: TrapItem;
  onClick?: () => void;
}

export const TrapCard: React.FC<TrapCardProps> = ({ item, onClick }) => {
  const getRarityScheme = (rarity: string = 'common') => {
    switch(rarity?.toLowerCase()) { // Safety check
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'very rare': return 'red'; // Added very rare
      default: return 'gray';
    }
  };

   const getDamageTypeColor = (type?: string) => { // Safety check
    switch(type?.toLowerCase()) {
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray';
      case 'thunder': return 'yellow'; // Added thunder
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
      borderColor="red.200" // Keeping original style
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

          <HStack spacing={4} wrap="wrap"> {/* Added wrap */}
            {item.duration && (
                 <HStack spacing={1}>
                    <Clock size={14} />
                    <Text fontSize="sm">{item.duration}</Text>
                </HStack>
            )}
            {/* Range might not be in data, keep conditional */}
            {item.range && item.range !== 'N/A' && (
                 <HStack spacing={1}>
                    <Crosshair size={14} />
                    <Text fontSize="sm">{item.range}</Text>
                 </HStack>
            )}
             {item.triggerMechanism && (
                <Badge variant="outline" colorScheme="yellow" fontSize="xs">
                    Trigger: {item.triggerMechanism}
                </Badge>
            )}
            {item.operation && (
                <Badge variant="outline" colorScheme="cyan" fontSize="xs">
                    Op: {item.operation}
                </Badge>
            )}
          </HStack>

          {/* Show damage if available */}
           {item.damage && item.damage !== 'N/A' && (
             <HStack spacing={1}>
                <AlertTriangle size={14} color="red"/>
                <Text fontSize="sm" fontWeight="semibold">{item.damage}</Text>
                {item.damageType && (
                    <Badge colorScheme={getDamageTypeColor(item.damageType)}>
                        {item.damageType}
                    </Badge>
                )}
             </HStack>
           )}

          {/* Removed Stats Preview as it's not in trap data */}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default TrapCard;