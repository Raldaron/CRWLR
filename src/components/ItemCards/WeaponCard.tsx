// components/ItemCards/WeaponCard.tsx
import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { Sword, Target } from 'lucide-react';
import DarkThemedCard from '@/components/ui/DarkThemedCard';
import type { WeaponItem } from '@/types/weapon';

interface WeaponCardProps {
  item: WeaponItem;
  onClick: () => void;
  isSelected?: boolean;
}

export const WeaponCard: React.FC<WeaponCardProps> = ({ 
  item, 
  onClick,
  isSelected = false
}) => {
  // Helper function to get rarity color
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      case 'unique': return 'yellow';
      case 'artifact': return 'red';
      default: return 'gray';
    }
  };

  return (
    <DarkThemedCard 
      onClick={onClick} 
      isSelected={isSelected}
      borderColor={isSelected ? "brand.400" : item.meleeRanged === 'Melee' ? "blue.800" : "green.800"}
    >
      <VStack spacing={2} align="start">
        <HStack justify="space-between" width="full">
          <Text fontWeight="bold" color="gray.200">{item.name}</Text>
          <Badge colorScheme={getRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
        </HStack>
        
        <HStack spacing={2}>
          <Badge colorScheme={item.meleeRanged === 'Melee' ? "blue" : "green"}>
            {item.meleeRanged}
          </Badge>
          <Badge variant="outline" colorScheme="gray">
            {item.weaponType}
          </Badge>
          <Badge colorScheme="gray" variant="outline">
            {item.handsRequired}
          </Badge>
        </HStack>
        
        <Text fontSize="xs" color="gray.400" noOfLines={2}>
          {item.description}
        </Text>
        
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.300">
            {item.damageAmount}
          </Text>
            {item.damageType}
        </HStack>
        
        {item.magicNonMagical === 'Magical' && (
          <Badge colorScheme="purple" size="sm">
            Magical
          </Badge>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default WeaponCard;