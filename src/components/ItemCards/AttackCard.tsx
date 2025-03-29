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
  Tooltip
} from '@chakra-ui/react';
import { Swords, Target, Zap } from 'lucide-react';
import type { WeaponItem } from '@/types/weapon';

// Define what an Attack looks like
export interface Attack {
  id: string;
  name: string;
  description: string;
  damageAmount: string;
  damageType: string;
  range: string;
  weaponType: string; 
  weaponId: string;
  // Weapon traits and abilities - defined as arrays
  traits: string[];
  abilities: string[];
  // Additional properties that might be useful
  accuracy?: number;
  criticalHit?: string;
  apCost?: number;
  sourceItem?: string;
}

interface AttackCardProps {
  attack: Attack;
  onClick?: () => void;
}

export const AttackCard: React.FC<AttackCardProps> = ({ attack, onClick }) => {
  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'slashing': return 'red';
      case 'piercing': return 'blue';
      case 'bludgeoning': return 'orange';
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
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
      borderLeft="4px solid"
      borderColor="red.400"
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          {/* Card Header */}
          <Flex justify="space-between" w="full" align="center">
            <HStack spacing={2}>
              <Swords size={16} className="text-red-500" />
              <Text fontWeight="bold" fontSize="lg">{attack.name}</Text>
            </HStack>
            <Badge colorScheme="gray">
              {attack.weaponType}
            </Badge>
          </Flex>
          
          {/* Attack Description */}
          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {attack.description || `Basic attack with ${attack.sourceItem || 'your weapon'}`}
          </Text>
          
          {/* Attack Stats */}
          <Box w="full">
            {/* Damage */}
            <HStack spacing={2} mb={2}>
              <Text fontSize="sm" fontWeight="bold">Damage:</Text>
              <Text fontSize="sm">{attack.damageAmount}</Text>
              <Badge colorScheme={getDamageTypeColor(attack.damageType)}>
                {attack.damageType}
              </Badge>
            </HStack>

            {/* Range */}
            <HStack spacing={2} mb={2}>
              <Target size={14} />
              <Text fontSize="sm">Range: {attack.range || 'Melee'}</Text>
            </HStack>
          </Box>

          {/* Traits and Abilities Preview */}
          {(attack.traits.length > 0 || attack.abilities.length > 0) && (
            <Box>
              {attack.traits.length > 0 && (
                <HStack spacing={1} mb={1} flexWrap="wrap">
                  <Text fontSize="xs" fontWeight="semibold">Traits:</Text>
                  {attack.traits.slice(0, 2).map((trait, idx) => (
                    <Badge key={idx} colorScheme="green" fontSize="xs">
                      {trait}
                    </Badge>
                  ))}
                  {attack.traits.length > 2 && (
                    <Badge colorScheme="green" fontSize="xs">
                      +{attack.traits.length - 2} more
                    </Badge>
                  )}
                </HStack>
              )}
              
              {attack.abilities.length > 0 && (
                <HStack spacing={1} flexWrap="wrap">
                  <Text fontSize="xs" fontWeight="semibold">Abilities:</Text>
                  {attack.abilities.slice(0, 2).map((ability, idx) => (
                    <Badge key={idx} colorScheme="purple" fontSize="xs">
                      {ability}
                    </Badge>
                  ))}
                  {attack.abilities.length > 2 && (
                    <Badge colorScheme="purple" fontSize="xs">
                      +{attack.abilities.length - 2} more
                    </Badge>
                  )}
                </HStack>
              )}
            </Box>
          )}

        </VStack>
      </CardBody>
    </Card>
  );
};

export default AttackCard;