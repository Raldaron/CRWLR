// components/equipment/UtilitySlotCard.tsx
import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  IconButton,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { Package, Plus, Minus } from 'lucide-react';
import DarkThemedCard from '../ui/DarkThemedCard';
import type { InventoryItem } from '@/types/inventory';

// Specify the type for a utility slot
interface UtilitySlot {
  id: string;
  name: string;
  stack: {
    item: InventoryItem;
    quantity: number;
  } | null;
}

interface UtilitySlotCardProps {
  slot: UtilitySlot;
  onAddItem: () => void;
  onViewDetails: (item: InventoryItem) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onUnequip: () => void;
}

const UtilitySlotCard: React.FC<UtilitySlotCardProps> = ({
  slot,
  onAddItem,
  onViewDetails,
  onIncrement,
  onDecrement,
  onUnequip
}) => {
  const hasItem = slot.stack !== null;
  
  return (
    <DarkThemedCard
      onClick={hasItem ? () => onViewDetails(slot.stack!.item) : onAddItem}
      isSelected={hasItem}
      borderColor={hasItem ? "green.600" : "gray.700"}
      isHoverable={true}
    >
      <VStack spacing={1} align="center" justify="center" h="full" position="relative">
        {slot.stack ? (
          // Show item info if equipped, with quantity badge
          <>
            <Package size={20} className="text-green-500" />
            <Text fontWeight="bold" fontSize="sm" textAlign="center" noOfLines={1} color="gray.200">
              {slot.stack.item.name}
            </Text>
            <Badge colorScheme="green">
              {slot.stack.item.itemType}
            </Badge>

            {/* Quantity controls */}
            {slot.stack && (
              <HStack mt={1}>
                <Button
                  size="xs"
                  colorScheme="accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement();
                  }}
                  aria-label="Use/Decrease quantity"
                >
                  <Minus size={12} />
                </Button>
                <Badge colorScheme="blue" fontSize="md" px={2}>
                  {slot.stack.quantity}
                </Badge>
                <Button
                  size="xs"
                  colorScheme="green"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement();
                  }}
                  aria-label="Add quantity"
                >
                  <Plus size={12} />
                </Button>
              </HStack>
            )}

            {/* Unequip button */}
            <Button
              size="xs"
              colorScheme="accent"
              position="absolute"
              top={1}
              right={1}
              height="20px"
              minWidth="20px"
              p={0}
              children="×"
              onClick={(e) => {
                e.stopPropagation();
                onUnequip();
              }}
            />
          </>
        ) : (
          // Show empty slot message
          <>
            <Package size={20} className="text-gray-500" />
            <Text color="gray.500" fontSize="sm" textAlign="center">
              {slot.name}
            </Text>
            <Text fontSize="xs" color="gray.600" textAlign="center">
              (Empty)
            </Text>
            <Button size="xs" colorScheme="green" mt={1}>
              Equip Item
            </Button>
          </>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default UtilitySlotCard;