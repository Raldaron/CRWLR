// components/ItemCards/WeaponCard.tsx
import React from 'react';
import { 
  VStack, 
  Text, 
  Badge, 
  HStack 
} from '@chakra-ui/react';
import { Sword } from 'lucide-react';
import DarkThemedCard from '../ui/DarkThemedCard';
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
  // Function to get the rarity color
  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };

  // Determine damage type color
  const getDamageTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'slashing': return 'red.400';
      case 'piercing': return 'blue.400';
      case 'bludgeoning': return 'orange.400';
      case 'fire': return 'red.400';
      case 'cold': return 'blue.400';
      case 'lightning': return 'yellow.400';
      case 'acid': return 'green.400';
      case 'force': return 'purple.400';
      default: return 'gray.400';
    }
  };

  return (
    <DarkThemedCard 
      onClick={onClick} 
      isSelected={isSelected}
      borderColor={isSelected ? "brand.400" : "gray.700"}
    >
      <VStack spacing={2} align="start">
        <HStack>
          <Sword className="text-red-400" size={18} />
          <Text fontWeight="bold" color="gray.200">{item.name}</Text>
        </HStack>
        
        <HStack wrap="wrap" spacing={1}>
          <Badge colorScheme={getRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
          <Badge variant="outline" colorScheme="blue">
            {item.weaponType}
          </Badge>
          <Badge colorScheme={item.meleeRanged === 'Melee' ? 'red' : 'blue'}>
            {item.meleeRanged}
          </Badge>
        </HStack>
        
        <Text fontSize="sm" color="gray.400" noOfLines={2}>
          {item.description}
        </Text>
        
        <HStack>
          <Text fontSize="sm" fontWeight="semibold" color={getDamageTypeColor(item.damageType)}>
            {item.damageAmount}
          </Text>
          <Text fontSize="sm" color="gray.400">
            {item.damageType}
          </Text>
        </HStack>
        
        {/* Additional abilities or traits */}
        {(item.abilities && item.abilities.length > 0) && (
          <HStack flexWrap="wrap">
            {item.abilities.slice(0, 2).map((ability, index) => (
              <Badge key={index} colorScheme="purple" size="sm">
                {ability}
              </Badge>
            ))}
            {item.abilities.length > 2 && (
              <Badge colorScheme="purple" variant="outline">
                +{item.abilities.length - 2} more
              </Badge>
            )}
          </HStack>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default WeaponCard;