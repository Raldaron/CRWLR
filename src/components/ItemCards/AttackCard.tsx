// src/components/ItemCards/AttackCard.tsx
import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { Sword, Target, Shield } from 'lucide-react';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { Attack } from '@/types/attack';

interface AttackCardProps {
  attack: Attack;
  onClick: () => void;
}

const AttackCard: React.FC<AttackCardProps> = ({ attack, onClick }) => {
  // Helper function to get weapon type color
  const getWeaponTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'sword': return 'blue';
      case 'dagger': return 'teal';
      case 'axe': return 'red';
      case 'mace': return 'orange';
      case 'hammer': return 'yellow';
      case 'polearm': return 'purple';
      case 'bow': return 'green';
      case 'crossbow': return 'cyan';
      case 'firearm': return 'pink';
      case 'staff': return 'brand';
      case 'wand': return 'accent';
      default: return 'gray';
    }
  };

  // Helper function to get damage type color
  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'fire': return 'red';
      case 'cold': return 'blue';
      case 'lightning': return 'yellow';
      case 'acid': return 'green';
      case 'force': return 'purple';
      case 'piercing': return 'orange';
      case 'bludgeoning': return 'gray';
      case 'slashing': return 'cyan';
      case 'necrotic': return 'pink';
      case 'radiant': return 'brand';
      case 'poison': return 'teal';
      case 'physical': return 'gray';
      default: return 'gray';
    }
  };

  // Determine if this is a magical attack
  const isMagical = attack.magicNonMagical === 'Magical';

  // Get the display name for the slot
  const slotName = attack.slot === 'primaryWeapon' ? 'Primary' : 'Secondary';

  return (
    <DarkThemedCard 
      onClick={onClick} 
      borderColor={attack.meleeRanged === 'Melee' ? "blue.800" : "green.800"}
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: 'lg',
        borderColor: attack.meleeRanged === 'Melee' ? "blue.600" : "green.600"
      }}
    >
      <VStack align="start" spacing={2}>
        <HStack justify="space-between" width="full">
          <HStack>
            <Sword 
              className={attack.meleeRanged === 'Melee' ? "text-blue-500" : "text-green-500"} 
              size={18} 
            />
            <Text fontWeight="bold" fontSize="md" color="gray.200">{attack.name}</Text>
          </HStack>
          
          <Badge colorScheme={attack.meleeRanged === 'Melee' ? "blue" : "green"}>
            {attack.meleeRanged}
          </Badge>
        </HStack>
        
        <HStack spacing={2} wrap="wrap">
          <Badge colorScheme={getWeaponTypeColor(attack.weaponType)}>
            {attack.weaponType}
          </Badge>
          <Badge variant="outline" colorScheme="gray">
            {attack.handsRequired}
          </Badge>
          {isMagical && (
            <Badge colorScheme="purple" variant="subtle">
              Magical
            </Badge>
          )}
        </HStack>
        
        <Text fontSize="xs" color="gray.400" noOfLines={2}>
          {attack.description}
        </Text>
        
        <HStack spacing={2} width="full" justify="space-between">
          <HStack>
            <Tooltip label={`${attack.damageAmount} ${attack.damageType} damage`}>
              <Badge colorScheme={getDamageTypeColor(attack.damageType)} px={2}>
                {attack.damageAmount}
              </Badge>
            </Tooltip>
          </HStack>
          
          <HStack spacing={1}>
            <Tooltip label={`${slotName} Weapon`}>
              <Box>
                <Shield size={14} className="text-gray-400" />
              </Box>
            </Tooltip>
          </HStack>
        </HStack>
      </VStack>
    </DarkThemedCard>
  );
};

export default AttackCard;
