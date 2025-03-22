import React from 'react';
import { Text, Badge, VStack } from '@chakra-ui/react';
import { Card, CardContent } from '@/components/ui/card';
import type { InventoryItem } from '@/types/inventory';

interface ItemCardProps {
  item: InventoryItem;
  onSelect: (item: InventoryItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => (
  <Card 
    className="cursor-pointer hover:bg-gray-50 transition-all"
    onClick={() => onSelect(item)}
  >
    <CardContent className="p-4">
      <VStack spacing={2} align="start">
        <Text className="font-semibold">{item.name}</Text>
        <Badge 
          className={
            item.rarity === 'Legendary' ? 'bg-yellow-200' :
            item.rarity === 'Epic' ? 'bg-purple-200' :
            item.rarity === 'Rare' ? 'bg-blue-200' :
            item.rarity === 'Uncommon' ? 'bg-green-200' :
            'bg-gray-200'
          }
        >
          {item.rarity}
        </Badge>
      </VStack>
    </CardContent>
  </Card>
);

export default ItemCard;