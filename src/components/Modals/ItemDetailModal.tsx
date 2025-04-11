import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Badge,
  Box,
  HStack,
} from '@chakra-ui/react';
import { InventoryItem } from '@/types/inventory';
import type { WeaponItem } from '@/types/weapon';
import { BookOpen } from 'lucide-react';

interface ItemDetailModalProps { // Ensure interface name is correct
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}


// Helper function to safely check if an item is a weapon
function isWeapon(item: InventoryItem | null): item is WeaponItem {
  return item?.itemType === 'Weapon';
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ 
  item, 
  isOpen, 
  onClose 
}) => {
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{item.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            <Text>{item.description}</Text>
            <Badge>{item.rarity}</Badge>
            
            {/* Show weapon-specific details if item is a weapon */}
            {isWeapon(item) && (
              <>
                <Text>Damage: {item.damageAmount}</Text>
                <Text>Type: {item.damageType}</Text>
                <Text>Weapon Type: {item.weaponType}</Text>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};



export default ItemDetailModal;