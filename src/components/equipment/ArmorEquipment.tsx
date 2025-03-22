import React, { useState } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Alert,
  AlertIcon,
  Flex,
  VStack,
  HStack
} from '@chakra-ui/react';
import { Shield } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import { ArmorCard } from '@/components/ItemCards/ArmorCard';
import type { ArmorItem } from '@/types/armor';
import DarkThemedCard from '@/components/ui/DarkThemedCard';

// Define types for our component props and state
interface CategoryCardProps {
  category: string;
  name: string;
  color: string;
  equippedCount: number;
  totalSlots: number;
  onClick: () => void;
}

interface ArmorSlotCardProps {
  title: string;
  index?: number;
  armor: ArmorItem | null;
  onSelect: () => void;
  armorType: string;
  onUnequip?: () => void;
  color?: string;
}

interface SubCategoryCardProps {
  name: string;
  color: string;
  slotKey: string;
  count: number;
  equippedCount: number;
  onClick: () => void;
}

// Type definitions for our slot structures
interface ArmorSlotConfig {
  name: string;
  count: number;
  armorType: string;
}

interface ArmorCategoryConfig {
  name: string;
  slots: string[];
  color: string;
}

// Define the hierarchy of armor slots
const ARMOR_CATEGORIES: Record<string, ArmorCategoryConfig> = {
  head: { 
    name: 'Head', 
    slots: ['head'],
    color: 'teal'
  },
  torso: {
    name: 'Torso',
    slots: ['shoulders', 'torso'],
    color: 'brand'
  },
  legs: {
    name: 'Legs',
    slots: ['legs', 'feet'],
    color: 'amber'
  },
  accessories: {
    name: 'Accessories',
    slots: ['face', 'neck', 'wrist', 'finger', 'waist', 'ankle', 'toes'],
    color: 'accent'
  }
};

// Slot type definitions
const ARMOR_SLOTS: Record<string, ArmorSlotConfig> = {
  head: { name: 'Head', count: 1, armorType: 'head' },
  shoulders: { name: 'Shoulders', count: 1, armorType: 'shoulders' },
  torso: { name: 'Torso', count: 1, armorType: 'torso' },
  legs: { name: 'Legs', count: 1, armorType: 'legs' },
  feet: { name: 'Feet', count: 1, armorType: 'feet' },
  face: { name: 'Face', count: 2, armorType: 'face' },
  neck: { name: 'Neck', count: 1, armorType: 'neck' },
  wrist: { name: 'Wrist', count: 2, armorType: 'wrist' },
  finger: { name: 'Finger', count: 4, armorType: 'finger' },
  waist: { name: 'Waist', count: 1, armorType: 'waist' },
  ankle: { name: 'Ankle', count: 2, armorType: 'ankle' },
  toes: { name: 'Toes', count: 4, armorType: 'toes' }
};

// Parent category card component
const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  name, 
  color,
  equippedCount,
  totalSlots,
  onClick
}) => (
  <DarkThemedCard
    onClick={onClick}
    isSelected={equippedCount > 0}
    borderColor={equippedCount > 0 ? `${color}.600` : "gray.700"}
    height="130px"
  >
    <VStack spacing={2} align="center" justify="center" h="full">
      <Shield 
        size={24} 
        className={equippedCount > 0 ? `text-${color}-400` : "text-gray-500"} 
      />
      <Text fontWeight="bold" fontSize="lg" textAlign="center" color="gray.200">
        {name}
      </Text>
      <Badge colorScheme={equippedCount > 0 ? color : "gray"}>
        {equippedCount}/{totalSlots} Equipped
      </Badge>
    </VStack>
  </DarkThemedCard>
);

// Armor Slot Card component
const ArmorSlotCard: React.FC<ArmorSlotCardProps> = ({
  title,
  index = 0,
  armor,
  onSelect,
  armorType,
  onUnequip,
  color = "brand"
}) => (
  <DarkThemedCard
    onClick={onSelect}
    isSelected={armor !== null}
    borderColor={armor ? `${color}.600` : "gray.700"}
    height="120px"
  >
    <VStack spacing={1} align="center" justify="center" h="full" position="relative">
      {armor ? (
        // Show armor info if equipped
        <>
          <Shield size={20} className={`text-${color}-400`} />
          <Text fontWeight="bold" fontSize="sm" textAlign="center" noOfLines={1} color="gray.200">
            {armor.name}
          </Text>
          <Text fontSize="xs" color="gray.400">
            AR: {armor.armorRating}
          </Text>
          {armor.tankModifier > 0 && (
            <Text fontSize="xs" color="gray.400">
              Tank: +{armor.tankModifier}
            </Text>
          )}
          
          {/* Unequip button */}
          {onUnequip && (
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
          )}
        </>
      ) : (
        // Show empty slot message
        <>
          <Shield size={20} className="text-gray-500" />
          <Text color="gray.500" fontSize="sm" textAlign="center" noOfLines={1}>
            {title} {index > 0 ? `${index + 1}` : ''}
          </Text>
          <Text fontSize="xs" color="gray.600" textAlign="center" noOfLines={1}>
            ({armorType})
          </Text>
          <Button size="xs" colorScheme={color} mt={1}>
            Equip
          </Button>
        </>
      )}
    </VStack>
  </DarkThemedCard>
);

// Sub-category card component
const SubCategoryCard: React.FC<SubCategoryCardProps> = ({ 
  name, 
  color,
  slotKey,
  count,
  equippedCount,
  onClick
}) => (
  <DarkThemedCard
    onClick={onClick}
    isSelected={equippedCount > 0}
    borderColor={equippedCount > 0 ? `${color}.600` : "gray.700"}
    height="100px"
  >
    <VStack spacing={1} align="center" justify="center" h="full">
      <Shield 
        size={18} 
        className={equippedCount > 0 ? `text-${color}-400` : "text-gray-500"} 
      />
      <Text fontWeight="bold" fontSize="sm" textAlign="center" color="gray.200">
        {name}
      </Text>
      {count > 1 && (
        <Text fontSize="xs" color="gray.500">
          {count} slots
        </Text>
      )}
      <Badge colorScheme={equippedCount > 0 ? color : "gray"}>
        {equippedCount}/{count} Equipped
      </Badge>
    </VStack>
  </DarkThemedCard>
);

// Main component
const ArmorEquipment: React.FC = () => {
  const {
    getInventoryByType,
    equippedItems,
    equipItem
  } = useCharacter();

  // State for managing modals
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);
  const [activeSubCategoryKey, setActiveSubCategoryKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Modal controls
  const { isOpen: isCategoryModalOpen, onOpen: openCategoryModal, onClose: closeCategoryModal } = useDisclosure();
  const { isOpen: isSubCategoryModalOpen, onOpen: openSubCategoryModal, onClose: closeSubCategoryModal } = useDisclosure();
  const { isOpen: isArmorSelectModalOpen, onOpen: openArmorSelectModal, onClose: closeArmorSelectModal } = useDisclosure();

  // Get armor from inventory
  const myArmor = getInventoryByType('Armor').filter(
    (item): item is { item: ArmorItem; quantity: number } => 
    item.item.itemType === 'Armor'
  );

  // Calculate equipped count for a slot
  const countEquippedInSlot = (slotKey: string): number => {
    const slot = ARMOR_SLOTS[slotKey];
    if (!slot) return 0;
    
    let equipped = 0;
    for (let i = 0; i < slot.count; i++) {
      const slotName = `${slotKey}${i || ''}` as keyof typeof equippedItems;
      if (equippedItems[slotName]) equipped++;
    }
    return equipped;
  };

  // Calculate total equipped count for a category
  const countEquippedInCategory = (categoryKey: string): number => {
    const category = ARMOR_CATEGORIES[categoryKey];
    if (!category) return 0;
    
    return category.slots.reduce((total: number, slotKey: string) => {
      return total + countEquippedInSlot(slotKey);
    }, 0);
  };

  // Calculate total slots in a category
  const countTotalSlotsInCategory = (categoryKey: string): number => {
    const category = ARMOR_CATEGORIES[categoryKey];
    if (!category) return 0;
    
    return category.slots.reduce((total: number, slotKey: string) => {
      return total + ARMOR_SLOTS[slotKey].count;
    }, 0);
  };

  // Filter armor based on selected slot type
  const getFilteredArmor = () => {
    if (!selectedSlot) return [];

    const slotArmorType = ARMOR_SLOTS[selectedSlot].armorType;
    return myArmor.filter(
      inventoryItem => inventoryItem.item.armorType === slotArmorType
    );
  };

  // Handle opening category modal
  const handleCategoryClick = (categoryKey: string) => {
    setActiveCategoryKey(categoryKey);
    openCategoryModal();
  };

  // Handle subcategory click
  const handleSubCategoryClick = (slotKey: string) => {
    if (ARMOR_SLOTS[slotKey].count === 1) {
      // If it's a single slot item, go directly to armor selection
      setSelectedSlot(slotKey);
      setSelectedIndex(0);
      openArmorSelectModal();
    } else {
      // If it's a multi-slot item, open the sub-category modal
      setActiveSubCategoryKey(slotKey);
      openSubCategoryModal();
    }
  };

  // Handle slot click within sub-category modal
  const handleSlotClick = (slotKey: string, index: number = 0) => {
    setSelectedSlot(slotKey);
    setSelectedIndex(index);
    openArmorSelectModal();
  };

  // Handle equipping an armor piece
  const handleArmorSelect = (armor: ArmorItem) => {
    if (selectedSlot) {
      const slotKey = `${selectedSlot}${selectedIndex || ''}` as keyof typeof equippedItems;
      equipItem(slotKey, armor);
      closeArmorSelectModal();
    }
  };

  // Handle unequipping an armor piece
  const handleUnequip = (slot: string, index: number = 0) => {
    const slotKey = `${slot}${index || ''}` as keyof typeof equippedItems;
    equipItem(slotKey, null);
  };

  return (
    <Box p={4} bg="gray.900">
      {/* Category Cards */}
      <SimpleGrid columns={[2, 4]} spacing={4} mb={6}>
        {Object.keys(ARMOR_CATEGORIES).map((categoryKey) => (
          <CategoryCard
            key={categoryKey}
            category={categoryKey}
            name={ARMOR_CATEGORIES[categoryKey].name}
            color={ARMOR_CATEGORIES[categoryKey].color}
            equippedCount={countEquippedInCategory(categoryKey)}
            totalSlots={countTotalSlotsInCategory(categoryKey)}
            onClick={() => handleCategoryClick(categoryKey)}
          />
        ))}
      </SimpleGrid>

      {/* Category Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={closeCategoryModal} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">
            {activeCategoryKey && ARMOR_CATEGORIES[activeCategoryKey].name} Armor
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <SimpleGrid columns={2} spacing={4}>
              {activeCategoryKey &&
                ARMOR_CATEGORIES[activeCategoryKey].slots.map((slotKey) => (
                  <SubCategoryCard
                    key={slotKey}
                    name={ARMOR_SLOTS[slotKey].name}
                    color={ARMOR_CATEGORIES[activeCategoryKey].color}
                    slotKey={slotKey}
                    count={ARMOR_SLOTS[slotKey].count}
                    equippedCount={countEquippedInSlot(slotKey)}
                    onClick={() => handleSubCategoryClick(slotKey)}
                  />
                ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Sub-Category Modal */}
      <Modal isOpen={isSubCategoryModalOpen} onClose={closeSubCategoryModal} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">
            {activeSubCategoryKey && ARMOR_SLOTS[activeSubCategoryKey].name} Slots
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <SimpleGrid columns={[2, 3, 4]} spacing={3}>
              {activeSubCategoryKey &&
                [...Array(ARMOR_SLOTS[activeSubCategoryKey].count)].map((_, i) => {
                  const slotName = `${activeSubCategoryKey}${i || ''}` as keyof typeof equippedItems;
                  
                  return (
                    <Box key={`${activeSubCategoryKey}-${i}`} position="relative">
                      <ArmorSlotCard
                        title={ARMOR_SLOTS[activeSubCategoryKey].name}
                        index={i}
                        armor={equippedItems[slotName] as ArmorItem}
                        onSelect={() => handleSlotClick(activeSubCategoryKey, i)}
                        armorType={ARMOR_SLOTS[activeSubCategoryKey].armorType}
                        onUnequip={() => handleUnequip(activeSubCategoryKey, i)}
                        color={
                          activeCategoryKey ? ARMOR_CATEGORIES[activeCategoryKey].color : "brand"
                        }
                      />
                    </Box>
                  );
                })}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Armor Selection Modal */}
      <Modal isOpen={isArmorSelectModalOpen} onClose={closeArmorSelectModal} size="4xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="gray.200">
            Select {selectedSlot && ARMOR_SLOTS[selectedSlot].name}
            {selectedIndex > 0 ? ` ${selectedIndex + 1}` : ''}
          </ModalHeader>
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            {getFilteredArmor().length === 0 ? (
              <Alert status="info" bg="gray.700" color="gray.200">
                <AlertIcon color="brand.400" />
                No {selectedSlot && ARMOR_SLOTS[selectedSlot].armorType} armor available in inventory
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {getFilteredArmor().map((inventoryItem) => (
                  <Box
                    key={inventoryItem.item.id}
                    onClick={() => handleArmorSelect(inventoryItem.item)}
                    cursor="pointer"
                  >
                    <ArmorCard
                      item={inventoryItem.item}
                      onClick={() => handleArmorSelect(inventoryItem.item)}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ArmorEquipment;