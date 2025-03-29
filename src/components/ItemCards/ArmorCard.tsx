// components/ItemCards/ArmorCard.tsx
import React from 'react';
import { 
  VStack, 
  Text, 
  Badge, 
  HStack 
} from '@chakra-ui/react';
import { Shield } from 'lucide-react';
import DarkThemedCard from '../ui/DarkThemedCard';
import type { ArmorItem } from '@/types/armor';

interface ArmorCardProps {
  item: ArmorItem;
  onClick: () => void;
  isSelected?: boolean;
}

export const ArmorCard: React.FC<ArmorCardProps> = ({ 
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
      case 'unique': return 'yellow';
      case 'heirloom': return 'red';
      case 'exceedingly rare': return 'pink';
      default: return 'gray';
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
          <Shield className="text-blue-400" size={18} />
          <Text fontWeight="bold" color="gray.200">{item.name}</Text>
        </HStack>
        
        <HStack wrap="wrap" spacing={1}>
          <Badge colorScheme={getRarityColor(item.rarity)}>
            {item.rarity}
          </Badge>
          <Badge variant="outline" colorScheme="teal">
            {item.armorType}
          </Badge>
        </HStack>
        
        <Text fontSize="sm" color="gray.400" noOfLines={2}>
          {item.description}
        </Text>
        
        <HStack>
          <Badge colorScheme="blue">
            AR: {item.armorRating}
          </Badge>
          {item.tankModifier > 0 && (
            <Badge colorScheme="purple">
              Tank: +{item.tankModifier}
            </Badge>
          )}
        </HStack>
        
        {/* Stat bonuses (if any) */}
        {Object.keys(item.statBonus).length > 0 && (
          <HStack flexWrap="wrap">
            {Object.entries(item.statBonus).slice(0, 2).map(([stat, bonus]) => (
              <Badge key={stat} colorScheme="teal" size="sm">
                +{bonus} {stat}
              </Badge>
            ))}
            {Object.keys(item.statBonus).length > 2 && (
              <Badge colorScheme="teal" variant="outline">
                +{Object.keys(item.statBonus).length - 2} more
              </Badge>
            )}
          </HStack>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default ArmorCard;